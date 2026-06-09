'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Konva from 'konva';
import { shopifyStorefrontFetch } from '@/lib/shopify-client';
import { useCart } from '@/hooks/useCart';

const CHAIN_COLLECTION_HANDLE = 'byj-chains';
const CHARM_COLLECTION_HANDLE = 'byj-faraways-charms';

const GET_COLLECTION_QUERY = `
  query getCollectionByHandle($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            featuredImage {
              url
              altText
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                  }
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const MIN_CHARMS = 1;
const MAX_CHARMS = 5;

const CATEGORY_CONFIG = {
  bracelets: { label: 'Bracelet', plural: 'Bracelets', keywords: ['bracelet', 'bracelets'] },
  necklaces: { label: 'Necklace', plural: 'Necklaces', keywords: ['necklace', 'necklaces', 'chain'] },
  anklets: { label: 'Anklet', plural: 'Anklets', keywords: ['anklet', 'anklets'] },
};

const MATERIALS = [
  { id: '9k-gold', label: 'Yellow', keyword: 'yellow', swatch: 'linear-gradient(147.45deg, #C59922 17.98%, #EAD59E 48.14%, #C59922 83.84%)' },
  { id: 'silver', label: 'White', keyword: 'white', swatch: 'linear-gradient(143.06deg, #DFDFDF 29.61%, #F3F3F3 48.83%, #DFDFDF 66.43%)' },
  { id: 'rose-gold', label: 'Rose', keyword: 'rose', swatch: 'linear-gradient(154.36deg, #F2B5B5 10.36%, #F8DBDB 68.09%)' },
];

const LENGTHS = ['14KT', '18KT'];

const getBaseName = (name) => {
  if (!name) return '';
  let n = name.toUpperCase();
  const stopWords = [
    '9K GOLD', '14K GOLD', '18K GOLD', 'SOLID GOLD', 'YELLOW GOLD', 'WHITE GOLD', 'ROSE GOLD',
    'YELLOW', 'WHITE', 'ROSE', 'GOLD', 'SILVER', 'PLATINUM', 'PLT',
    ' IN ', ' - ', '9K', '14K', '18K', '9CT', '18CT',
    '14KT', '18KT',
    '14 INCH', '16 INCH', '18 INCH', '20 INCH', '22 INCH', '24 INCH'
  ];
  stopWords.forEach(word => {
    n = n.split(word).join(' ');
  });
  return n.replace(/\s+/g, ' ').trim();
};

const getMaterialKeyword = (title, alt) => {
  const t = (title || '').toLowerCase();
  const a = (alt || '').toLowerCase();
  if (t.includes('white') || t.includes('silver') || a.includes('white') || a.includes('silver')) return 'white';
  if (t.includes('rose') || a.includes('rose')) return 'rose';
  if (t.includes('platinum') || t.includes('plt') || a.includes('platinum') || a.includes('plt')) return 'plt';
  return 'yellow';
};

const getKaratValue = (title) => {
  const t = (title || '').toLowerCase();
  if (t.includes('18k') || t.includes('18ct') || t.includes('18kt')) return '18KT';
  if (t.includes('9k') || t.includes('9ct') || t.includes('9kt')) return '9KT';
  return '14KT';
};

const formatPrice = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value / 100); // Assuming price is in subunits (cents/paise) based on script
};

const normalizeType = (value) => {
  const type = String(value || '').toLowerCase();
  if (type.includes('neck')) return 'necklaces';
  if (type.includes('anklet')) return 'anklets';
  return 'bracelets';
};

export default function BuildYourJewelryBuilder({ initialType = 'bracelets' }) {
  const category = normalizeType(initialType);
  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.bracelets;

  const [material, setMaterial] = useState('9k-gold');
  const [length, setLength] = useState('14KT');
  const [chains, setChains] = useState([]);
  const [charms, setCharms] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedCharms, setSelectedCharms] = useState([]);
  const [activeDesktopStep, setActiveStep] = useState('length');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [canvasPreview, setCanvasPreview] = useState(null);
  const [currentDrawerKey, setCurrentDrawerKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingToBag, setAddingToBag] = useState(false);

  // Konva Refs
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  const productImgRef = useRef(null);
  const charmGroupRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  const { addToCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const [chainRes, charmRes] = await Promise.all([
          shopifyStorefrontFetch(GET_COLLECTION_QUERY, { handle: CHAIN_COLLECTION_HANDLE, first: 250 }),
          shopifyStorefrontFetch(GET_COLLECTION_QUERY, { handle: CHARM_COLLECTION_HANDLE, first: 250 })
        ]);

        const groupProducts = (data) => {
          const products = data?.collection?.products?.edges || [];
          const groups = {};
          const order = [];
          products.forEach(({ node: p }) => {
            const variants = p.variants?.edges || [];
            variants.forEach(({ node: v }) => {
              const fullTitle = `${p.title} - ${v.title}`;
              const base = getBaseName(fullTitle);
              if (!groups[base]) {
                order.push(base);
                groups[base] = { 
                  base,
                  master: null,
                  versions: {},
                  karats: []
                };
              }
              const mKey = getMaterialKeyword(fullTitle, v.image?.altText || p.featuredImage?.altText || '');
              const kKey = getKaratValue(fullTitle);
              
              if (!groups[base].karats.includes(kKey)) groups[base].karats.push(kKey);
              if (!groups[base].versions[mKey]) groups[base].versions[mKey] = {};
              
              const versionData = {
                id: v.id,
                handle: p.handle,
                title: p.title,
                variantTitle: v.title,
                fullTitle,
                price: parseFloat(v.price.amount) * 100, // convert to subunits
                img: v.image?.url || p.featuredImage?.url || null,
                thumb: v.image?.url || p.featuredImage?.url || null,
                alt: v.image?.altText || p.featuredImage?.altText || ''
              };

              groups[base].versions[mKey][kKey] = versionData;
              if (!groups[base].master) groups[base].master = versionData;
            });
          });
          return order.map(base => groups[base]);
        };

        setChains(groupProducts(chainRes));
        setCharms(groupProducts(charmRes).sort((a, b) => a.base.localeCompare(b.base)));
      } catch (err) {
        console.error('Failed to load BYJ data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Konva Initialization
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.offsetWidth || 400;

    const stage = new Konva.Stage({
      container: container,
      width: width,
      height: width,
      draggable: true
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Background rect to catch events
    layer.add(new Konva.Rect({
      width: width,
      height: width,
      fill: 'rgba(255,255,255,0)'
    }));

    const productImg = new Konva.Image({
      x: width / 2,
      y: width / 2,
      offsetX: 0,
      offsetY: 0
    });
    layer.add(productImg);

    const charmGroup = new Konva.Group({ name: 'byj-charm-group' });
    layer.add(charmGroup);

    stageRef.current = stage;
    layerRef.current = layer;
    productImgRef.current = productImg;
    charmGroupRef.current = charmGroup;

    // Zoom handling
    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const scaleBy = 1.1;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.5, Math.min(4, newScale));
      
      stage.scale({ x: clampedScale, y: clampedScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };
      stage.position(newPos);
      setZoom(clampedScale);
    });

    const handleResize = () => {
      const newWidth = container.offsetWidth || 400;
      stage.width(newWidth);
      stage.height(newWidth);
      layer.findOne('Rect').setAttrs({ width: newWidth, height: newWidth });
      stage.batchDraw();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      stage.destroy();
    };
  }, [loading]);

  const updateCanvasImage = (src) => {
    if (!src || !productImgRef.current) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const stage = stageRef.current;
      const width = stage.width();
      const height = stage.height();
      const scale = Math.min(width / img.width, height / img.height) * 0.90;
      const nw = img.width * scale;
      const nh = img.height * scale;

      productImgRef.current.setAttrs({
        image: img,
        x: width / 2,
        y: height / 2,
        width: nw,
        height: nh,
        offsetX: nw / 2,
        offsetY: nh / 2
      });
      layerRef.current.batchDraw();
      renderCharms();
    };
    img.src = src;
  };

  const renderCharms = () => {
    const group = charmGroupRef.current;
    if (!group || !productImgRef.current) return;
    group.destroyChildren();

    const flat = [];
    selectedCharms.forEach(c => {
      // Always find the version matching the current material/length for rendering
      const charmData = charms.find(g => g.base === c.base);
      const version = getActiveVersion(charmData, material, length) || c;
      
      for (let i = 0; i < c.qty; i++) {
        flat.push({ src: version.img, handle: version.handle, base: version.base });
      }
    });

    if (flat.length === 0) {
      layerRef.current.batchDraw();
      return;
    }

    const img = productImgRef.current;
    const imgCX = img.x();
    const imgCY = img.y();
    const imgW = img.width();
    const imgH = img.height();
    const imgLeft = imgCX - imgW / 2;
    const imgTop = imgCY - imgH / 2;

    const circleX = imgLeft + imgW * 0.50;
    const circleY = imgTop + imgH * 0.47;
    const radius = imgW * 0.450;
    const angularGap = 14;
    const totalSpan = (flat.length - 1) * angularGap;
    const startAngle = 90 - totalSpan / 2;
    const stageWidth = stageRef.current.width();

    const slots = flat.map((_, idx) => {
      const angleDeg = startAngle + idx * angularGap;
      const angleRad = angleDeg * Math.PI / 180;
      return {
        x: circleX + radius * Math.cos(angleRad),
        y: circleY + radius * Math.sin(angleRad),
        angleDeg: angleDeg,
        idx: idx
      };
    });

    flat.forEach((item, idx) => {
      const charmImg = new window.Image();
      charmImg.crossOrigin = 'anonymous';
      charmImg.onload = () => {
        const s = (stageWidth * 0.055) / Math.max(charmImg.width, charmImg.height);
        const iw = charmImg.width * s;
        const ih = charmImg.height * s;
        const slot = slots[idx];

        const ci = new Konva.Image({
          image: charmImg,
          x: slot.x,
          y: slot.y,
          width: iw,
          height: ih,
          offsetX: iw / 2,
          offsetY: 0,
          rotation: slot.angleDeg - 90,
          draggable: true,
          name: 'charm-node'
        });

        ci._slotIdx = idx;

        ci.on('dragstart', function() {
          this.moveToTop();
          this._origSlot = slots[this._slotIdx];
        });

        ci.on('dragend', function() {
          const self = this;
          const selfIdx = self._slotIdx;
          const cx = self.x();
          const cy = self.y();

          let nearestIdx = -1;
          let nearestDist = Infinity;
          slots.forEach((s, i) => {
            if (i === selfIdx) return;
            const dist = Math.hypot(cx - s.x, cy - s.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestIdx = i;
            }
          });

          const threshold = iw * 2;
          if (nearestIdx !== -1 && nearestDist < threshold) {
            // Swap logic
            setSelectedCharms(prev => {
              const flatHandles = [];
              prev.forEach(c => {
                for(let j=0; j<c.qty; j++) flatHandles.push(c.base);
              });
              
              const tmp = flatHandles[selfIdx];
              flatHandles[selfIdx] = flatHandles[nearestIdx];
              flatHandles[nearestIdx] = tmp;

              const newCharms = [];
              flatHandles.forEach(base => {
                const charmData = charms.find(c => c.base === base);
                const version = getActiveVersion(charmData, material, length);
                const last = newCharms[newCharms.length - 1];
                if (last && last.base === base) {
                  last.qty++;
                } else {
                  newCharms.push({ ...version, base, qty: 1 });
                }
              });
              return newCharms;
            });
          } else {
            self.to({
              x: self._origSlot.x,
              y: self._origSlot.y,
              rotation: self._origSlot.angleDeg - 90,
              duration: 0.18,
              easing: Konva.Easings.EaseOut
            });
          }
        });

        group.add(ci);
        layerRef.current.batchDraw();
      };
      charmImg.src = item.src;
    });
  };

  const getActiveVersion = (group, matId, karat) => {
    if (!group) return null;
    const mat = MATERIALS.find(m => m.id === matId);
    const keyword = mat?.keyword || 'yellow';
    const colorVersions = group.versions[keyword] || group.versions['yellow'] || Object.values(group.versions)[0];
    if (!colorVersions) return null;
    return colorVersions[karat] || null;
  };

  const availableLengths = useMemo(() => {
    if (loading) return ['14KT', '18KT'];
    
    if (selectedStyle) {
      return [...selectedStyle.karats].sort((a, b) => parseInt(a) - parseInt(b));
    }

    const k = new Set();
    chains.forEach(c => c.karats.forEach(kt => k.add(kt)));
    charms.forEach(c => c.karats.forEach(kt => k.add(kt)));
    if (k.size === 0) return ['14KT', '18KT'];
    return Array.from(k).sort((a, b) => parseInt(a) - parseInt(b));
  }, [chains, charms, selectedStyle, loading]);

  useEffect(() => {
    if (availableLengths.length > 0 && !availableLengths.includes(length)) {
      setLength(availableLengths[0]);
    }
  }, [availableLengths, length]);

  useEffect(() => {
    if (selectedStyle) {
      const v = getActiveVersion(selectedStyle, material, length);
      updateCanvasImage(v?.img);
    }
  }, [selectedStyle, material, length]);

  useEffect(() => {
    renderCharms();
  }, [selectedCharms, material, length]);

  useEffect(() => {
    if (selectedCharms.length > 0) {
      setSelectedCharms(prev => prev.map(c => {
        const group = charms.find(g => g.base === c.base);
        const version = getActiveVersion(group, material, length);
        return version ? { ...version, base: c.base, qty: c.qty } : c;
      }));
    }
  }, [material, length]);

  const handleZoom = (factor) => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const newScale = Math.max(0.5, Math.min(4, oldScale * factor));
    
    const center = { x: stage.width() / 2, y: stage.height() / 2 };
    const relatedToCenter = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    stage.to({
      scaleX: newScale,
      scaleY: newScale,
      x: center.x - relatedToCenter.x * newScale,
      y: center.y - relatedToCenter.y * newScale,
      duration: 0.3,
      easing: Konva.Easings.EaseOut,
      onUpdate: () => setZoom(stage.scaleX())
    });
  };

  const zoomToCharms = () => {
    const stage = stageRef.current;
    const img = productImgRef.current;
    if (!stage || !img) return;

    const width = stage.width();
    const height = stage.height();
    const targetScale = 1.8;
    
    // Focus on bottom center where charms are placed
    const targetX = img.x();
    const targetY = img.y() + (img.height() * 0.35);

    stage.to({
      scaleX: targetScale,
      scaleY: targetScale,
      x: width / 2 - targetX * targetScale,
      y: height / 2 - targetY * targetScale,
      duration: 0.8,
      easing: Konva.Easings.EaseInOut,
      onUpdate: () => setZoom(stage.scaleX())
    });
  };

  const zoomReset = () => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.to({
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
      duration: 0.5,
      easing: Konva.Easings.EaseInOut,
      onUpdate: () => setZoom(1)
    });
  };

  useEffect(() => {
    if (selectedCharms.length === 1 && selectedCharms[0].qty === 1) {
      zoomToCharms();
    } else if (selectedCharms.length === 0) {
      zoomReset();
    }
  }, [selectedCharms.length]);

  const toggleCharmSelection = (charmGroup) => {
    const version = getActiveVersion(charmGroup, material, length);
    const existing = selectedCharms.find(c => c.base === charmGroup.base);
    const totalCount = selectedCharms.reduce((acc, c) => acc + c.qty, 0);

    if (existing) {
      setSelectedCharms(prev => prev.filter(c => c.base !== charmGroup.base));
    } else {
      if (totalCount >= MAX_CHARMS) {
        alert(`Max ${MAX_CHARMS} charms allowed`);
        return;
      }
      setSelectedCharms(prev => [...prev, { ...version, base: charmGroup.base, qty: 1 }]);
    }
  };

  const updateCharmQty = (base, delta) => {
    setSelectedCharms(prev => {
      const existing = prev.find(c => c.base === base);
      if (!existing && delta < 0) return prev;

      const totalCount = prev.reduce((acc, c) => acc + c.qty, 0);
      if (delta > 0 && totalCount >= MAX_CHARMS) {
        alert(`Max ${MAX_CHARMS} charms allowed`);
        return prev;
      }

      const newCharms = prev.map(c => {
        if (c.base === base) {
          const newQty = Math.max(0, c.qty + delta);
          return newQty === 0 ? null : { ...c, qty: newQty };
        }
        return c;
      }).filter(Boolean);

      // If it's a new charm being added via + button (not possible in current UI but for safety)
      if (delta > 0 && !existing) {
        const charmData = charms.find(c => c.base === base);
        const version = getActiveVersion(charmData, material, length);
        newCharms.push({ ...version, base, qty: 1 });
      }

      return newCharms;
    });
  };

  const totalPrice = useMemo(() => {
    const styleV = getActiveVersion(selectedStyle, material, length);
    if (!styleV) return 0;
    
    let total = parseFloat(styleV.price || 0); // Already in subunits
    
    selectedCharms.forEach(c => {
      const group = charms.find(g => g.base === c.base);
      const version = getActiveVersion(group, material, length);
      if (version) {
        total += parseFloat(version.price || 0) * c.qty; // Already in subunits
      }
    });
    
    return total;
  }, [selectedStyle, selectedCharms, material, length, charms]);

  const isReady = selectedStyle && selectedCharms.reduce((acc, c) => acc + c.qty, 0) >= MIN_CHARMS;

  const openDrawer = (key) => {
    setCurrentDrawerKey(key);
    setIsDrawerOpen(true);
  };

  const handleConfirm = () => {
    const stage = stageRef.current;
    if (!stage) return;

    // Save current state to restore after capture
    const oldScale = stage.scaleX();
    const oldPos = stage.position();

    // Reset to default view for the summary capture
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();

    const dataURL = stage.toDataURL({ pixelRatio: 2 });

    // Restore the user's zoom/pan state
    stage.scale({ x: oldScale, y: oldScale });
    stage.position(oldPos);
    stage.batchDraw();

    setCanvasPreview(dataURL);
    setIsSummaryOpen(true);
  };

  const handleAddToBag = async () => {
    if (!selectedStyle || selectedCharms.length === 0) return;
    setAddingToBag(true);
    try {
      const styleV = getActiveVersion(selectedStyle, material, length);
      const groupId = `BYJ-${Date.now()}`; // Unique group ID for this bespoke item
      const charmDetails = selectedCharms.map((c, i) => `${i + 1}. ${c.fullTitle}`).join(', ');
      
      const properties = {
        'Product Type': categoryConfig.label,
        'Style': styleV.fullTitle,
        'Length': length,
        'Material': MATERIALS.find(m => m.id === material)?.label,
        'Charms': charmDetails,
        '_byj_group_id': groupId,
        '_byj_preview': canvasPreview,
        '_byj_style_img': styleV.img,
        '_byj_style_price': styleV.price,
        '_byj_charms_json': JSON.stringify(selectedCharms.map(c => ({ title: c.fullTitle, price: c.price, qty: c.qty, img: c.img })))
      };

      const mainItem = {
        id: styleV.id,
        title: 'Bespoke Story Chain',
        quantity: 1,
        price: styleV.price / 100,
        finalPrice: styleV.price / 100,
        properties
      };

      const charmItems = selectedCharms.map(c => ({
        id: c.id,
        title: `Charm: ${c.fullTitle}`,
        quantity: c.qty,
        price: c.price / 100,
        finalPrice: c.price / 100,
        properties: {
          '_byj_group_id': groupId,
          '_byj_parent': styleV.id
        }
      }));

      await addToCart({
        products: [mainItem, ...charmItems]
      });
      
      setIsSummaryOpen(false);
    } catch (err) {
      console.error('Add to bag failed:', err);
    } finally {
      setAddingToBag(false);
    }
  };

  const containerStyle = {
  };

  return (
    <div className="build-your-jewelry-bracelets">
      <style jsx global>{`
        .build-your-jewelry-bracelets { color: #1c1810; font-family: Figtree, sans-serif; }
        .byj-layout { display: grid; grid-template-columns: 1fr 420px; grid-template-areas: "canvas panel"; min-height: 100vh; background: #fff; }
        .byj-canvas-area { grid-area: canvas; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; padding: 40px 24px; min-height: 60vh; }
        .byj-canvas-area.has-bg { background-image: url(https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Q1PartB2953_37dd8896-3ea2-4c65-8c86-707f5cacb9b3.webp?v=1780657459); background-size: cover; background-position: center; }
        #byj-konva-container { width: 100%; max-width: 580px; aspect-ratio: 1; cursor: grab; border-radius: 12px; overflow: hidden; touch-action: none;}
        .byj-canvas-controls { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,.95); border: 1px solid #e0d0ba; border-radius: 100px; padding: 8px 18px; box-shadow: 0 4px 20px rgba(0,0,0,.08); backdrop-filter: blur(8px); z-index: 20; }
        .byj-ctrl-btn { width: 34px; height: 34px; border: none; background: transparent; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #1c1810; transition: all .2s; }
        .byj-ctrl-btn:hover { background: #fef5f1; color: #5a413f; }
        .byj-zoom-track { width: 100px; height: 4px; background: #e0d0ba; border-radius: 2px; position: relative; margin: 0 4px; }
        .byj-zoom-thumb { width: 14px; height: 14px; border-radius: 50%; background: #5a413f; border: 2px solid #fff; position: absolute; top: 50%; transform: translate(-50%,-50%); transition: left .15s; display: block; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .byj-config-panel { grid-area: panel; background: #fff; border-left: 1px solid #f0f0f0; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; overflow: hidden; box-shadow: -4px 0 30px rgba(0,0,0,0.03); }
        .byj-panel-scroll { flex: 1; overflow-y: auto; scrollbar-width: thin; scroll-behavior: smooth; }
        .byj-panel-scroll::-webkit-scrollbar { width: 5px; }
        .byj-panel-scroll::-webkit-scrollbar-track { background: #fff; }
        .byj-panel-scroll::-webkit-scrollbar-thumb { background: #e0d0ba; border-radius: 10px; }
        .byj-panel-scroll::-webkit-scrollbar-thumb:hover { background: #5a413f; }
        .byj-material-bar { display: flex; align-items: center; gap: 12px; padding: 20px 24px; border-bottom: 1px solid #f0f0f0; background: #fff; }
        .byj-material-label { font-size: 11px; color: #5a413f; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
        .byj-mat-name { font-size: 13px; color: #000; font-weight: 600; }
        .byj-mat-btn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid transparent; padding: 2px; background: transparent; cursor: pointer; transition: all .2s ease; }
        .byj-mat-btn.active { border-color: #5a413f; transform: scale(1.1); }
        .byj-mat-swatch { display: block; width: 100%; height: 100%; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05); }
        .byj-step { border-bottom: 1px solid #f0f0f0; transition: all .3s; }
        .byj-step.open { background: #fff; }
        .byj-step-header { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px; cursor: pointer; user-select: none; transition: background .2s; }
        .byj-step-header:hover { background: #fcfcfc; }
        .byj-step-left { display: flex; align-items: center; gap: 14px; }
        .byj-step-check { width: 22px; height: 22px; border-radius: 50%; background: #5a413f; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .3s; }
        .byj-step-check.pending { background: transparent; color: #e0d0ba; border: 1.5px solid #e0d0ba; }
        .byj-step-label { font-size: 11px; color: #5a413f; font-weight: 700; margin-bottom: 3px; letter-spacing: .1em; text-transform: uppercase; }
        .byj-step-value { font-size: 13px; color: #1c1810; font-weight: 500; }
        .byj-chevron { transition: transform .3s cubic-bezier(.4,0,.2,1); color: #5a413f; opacity: 0.6; }
        .byj-step.open .byj-chevron { transform: rotate(180deg); opacity: 1; }
        .byj-step-body { padding: 0 24px 24px; display: none; }
        .byj-step.open .byj-step-body { display: block; animation: byjSlideDown .3s ease-out; }
        @keyframes byjSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .byj-confirm-bar { display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-top: 1px solid #f0f0f0; background: #fff; z-index: 10; width: 100%; }
        .byj-total-wrap { display: flex; flex-direction: column; }
        .byj-total-label { font-size: 10px; color: #5a413f; text-transform: uppercase; letter-spacing: .1em; font-weight: 700; }
        .byj-total-price { font-size: 20px; font-weight: 800; color: #1c1810; }
        .byj-confirm-btn { flex: 1; height: 50px; background: #1c1810; color: #fff; border: none; border-radius: 100px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 700; transition: all .3s cubic-bezier(.16,1,.3,1); text-transform: uppercase; letter-spacing: 0.05em; font-size: 14px; }
        .byj-confirm-btn:hover:not(:disabled) { background: #5a413f; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(90,65,63,0.2); }
        .byj-confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .byj-option-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .byj-opt-btn { padding: 8px 20px; border: 1.5px solid #e0d0ba; border-radius: 100px; font-size: 12px; cursor: pointer; background: transparent; transition: all .2s; font-weight: 600; }
        .byj-opt-btn.active { background: #5a413f; border-color: #5a413f; color: #fff; transform: scale(1.05); }
        .byj-style-grid, .byj-charm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .byj-style-card, .byj-charm-item { border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; cursor: pointer; background: #fff; transition: all .3s cubic-bezier(.16,1,.3,1); display: flex; flex-direction: column; position: relative; }
        .byj-style-card:hover, .byj-charm-item:hover { border-color: #e0d0ba; box-shadow: 0 8px 25px rgba(0,0,0,.06); transform: translateY(-4px); }
        .byj-style-card.active, .byj-charm-item.selected { border-color: #5a413f; border-width: 1.5px; }
        .byj-style-img-wrap { position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: transparent; border-bottom: 1px solid #f0f0f0; padding: 16px; }
        .byj-style-img-wrap img { width: 100%; height: 100%; object-fit: contain; transition: transform .5s cubic-bezier(.16,1,.3,1); }
        .byj-style-card:hover img { transform: scale(1.1); }
        .byj-style-check-badge { position: absolute; top: 12px; left: 12px; width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid #e0d0ba; background: #fff; display: flex; align-items: center; justify-content: center; z-index: 2; color: transparent; transition: all .3s; }
        .byj-style-card.active .byj-style-check-badge, .byj-charm-item.selected .byj-style-check-badge { background: #5a413f; border-color: #5a413f; color: #fff; }
        .byj-style-info { padding: 14px; display: flex; flex-direction: column; gap: 6px; flex: 1; justify-content: space-between; }
        .byj-style-name { font-size: 13px; font-weight: 600; line-height: 1.4; color: #1c1810; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .byj-style-price { font-size: 14px; font-weight: 700; color: #5a413f; }
        .byj-charm-qty-wrap { display: flex; align-items: center; justify-content: space-between; width: 100%; background: #fef5f1; margin-top: 8px; border-radius: 100px; overflow: hidden; border: 1px solid #f0e0d0; }
        .byj-qty-btn { background: transparent; border: none; width: 34px; height: 34px; font-size: 20px; color: #5a413f; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s; }
        .byj-qty-btn:hover { background: #e0d0ba; color: #fff; }
        .byj-qty-num { font-size: 14px; font-weight: 700; min-width: 24px; text-align: center; color: #5a413f; }
        .byj-mobile-steps { display: none; }
        .byj-right-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 90vw; max-width: 420px; background: #fff; z-index: 1101; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .5s cubic-bezier(.16,1,.3,1); box-shadow: -15px 0 50px rgba(0,0,0,0.1); }
        .byj-right-drawer.open { transform: translateX(0); }
        .byj-drawer-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1100; backdrop-filter: blur(4px); }
        .byj-drawer-overlay.active { display: block; }
        .byj-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #f0f0f0; background: #fff; }
        .byj-drawer-title { font-size: 13px; font-weight: 700; letter-spacing: 0.15em; color: #5a413f; text-transform: uppercase; }
        .byj-drawer-body { flex: 1; overflow-y: auto; padding: 24px; scroll-behavior: smooth; }
        .byj-drawer-body::-webkit-scrollbar { width: 4px; }
        .byj-drawer-body::-webkit-scrollbar-track { background: transparent; }
        .byj-drawer-body::-webkit-scrollbar-thumb { background: #e0d0ba; border-radius: 10px; }
        .byj-summary-scroll::-webkit-scrollbar { width: 4px; }
        .byj-summary-scroll::-webkit-scrollbar-track { background: transparent; }
        .byj-summary-scroll::-webkit-scrollbar-thumb { background: #e0d0ba; border-radius: 10px; }
        .byj-drawer-footer { padding: 24px; border-top: 1px solid #f0f0f0; background: #fff; }
        .byj-drawer-done { width: 100%; height: 50px; background: #1c1810; color: #fff; border: none; border-radius: 100px; cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; transition: all .3s; }
        .byj-drawer-done:hover { background: #5a413f; transform: translateY(-2px); }
        
        @media (max-width: 860px) {
          .byj-layout { grid-template-columns: 1fr; grid-template-areas: "canvas" "mobile-steps"; min-height: unset; background: #fff; }
          .byj-canvas-area { padding: 20px 16px; min-height: 50vh; }
          .byj-canvas-controls { bottom: 15px; scale: 0.9; }
          .byj-config-panel { display: none !important; }
          .byj-mobile-steps { display: block; grid-area: mobile-steps; background: #fff; }
          .byj-mobile-mat-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #fff; border-bottom: 1px solid #f0f0f0; border-top: 1px solid #f0f0f0; }
          .byj-mobile-mat-label { font-size: 11px; color: #5a413f; font-weight: 700; text-transform: uppercase; }
          .byj-mob-swatches { display: flex; gap: 10px; }
          .byj-mob-row { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; background: #fff; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
          .byj-mob-check { width: 22px; height: 22px; border-radius: 50%; background: #5a413f; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .byj-mob-check.pending { background: transparent; color: #e0d0ba; border: 1.5px solid #e0d0ba; }
          .byj-mob-confirm-bar { display: flex; align-items: center; gap: 16px; padding: 18px 20px; background: #fff; border-top: 1px solid #f0f0f0; position: sticky; bottom: 0; z-index: 50; box-shadow: 0 -10px 20px rgba(0,0,0,0.03); }
          .byj-mob-total { font-size: 18px; font-weight: 800; color: #1c1810; }
        }
      `}</style>

      <div className="build-your-jewelry-wrapper">
        <div className="byj-layout">
          <div className={`byj-canvas-area ${!selectedStyle ? 'has-bg' : ''}`}>
            <div id="byj-konva-container" ref={containerRef} style={containerStyle}></div>
            <div className="byj-canvas-controls">
              <button className="byj-ctrl-btn" onClick={() => handleZoom(0.8)} aria-label="Zoom out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
              <div className="byj-zoom-track">
                <div className="byj-zoom-thumb" style={{ left: `${((zoom - 0.5) / 3.5) * 100}%` }}></div>
              </div>
              <button className="byj-ctrl-btn" onClick={() => handleZoom(1.2)} aria-label="Zoom in">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
            </div>
          </div>

          {/* Desktop Panel */}
          <div className="byj-config-panel">
            <div className="byj-panel-scroll">
              <div className="byj-material-bar">
                <span className="byj-material-label">Material:</span>
                {MATERIALS.map(m => (
                  <button key={m.id} className={`byj-mat-btn ${material === m.id ? 'active' : ''}`} onClick={() => setMaterial(m.id)}>
                    <span className="byj-mat-swatch" style={{ background: m.swatch }}></span>
                  </button>
                ))}
                <span className="byj-mat-name">{MATERIALS.find(m => m.id === material)?.label}</span>
              </div>

              <div id="byj-desktop-steps">
                {/* Length Step */}
                <div className={`byj-step ${activeDesktopStep === 'length' ? 'open' : ''}`}>
                  <div className="byj-step-header" onClick={() => setActiveStep(activeDesktopStep === 'length' ? '' : 'length')}>
                    <div className="byj-step-left">
                      <span className="byj-step-check">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      <div>
                        <div className="byj-step-label">LENGTH</div>
                        <div className="byj-step-value">{length}</div>
                      </div>
                    </div>
                    <svg className="byj-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div className="byj-step-body">
                    <div className="byj-option-grid">
                      {availableLengths.map(l => (
                        <button key={l} className={`byj-opt-btn ${length === l ? 'active' : ''}`} onClick={() => setLength(l)}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Style Step */}
                <div className={`byj-step ${activeDesktopStep === 'style' ? 'open' : ''}`}>
                  <div className="byj-step-header" onClick={() => setActiveStep(activeDesktopStep === 'style' ? '' : 'style')}>
                    <div className="byj-step-left">
                      <span className={`byj-step-check ${!selectedStyle ? 'pending' : ''}`}>
                        {!selectedStyle ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </span>
                      <div>
                        <div className="byj-step-label">STYLE</div>
                        <div className="byj-step-value">{selectedStyle ? getActiveVersion(selectedStyle, material, length)?.fullTitle : `Choose your ${categoryConfig.label}`}</div>
                      </div>
                    </div>
                    <svg className="byj-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div className="byj-step-body">
                    <div className="byj-style-grid">
                      {chains.map(group => {
                        const version = getActiveVersion(group, material, length);
                        if (!version) return null;
                        const isActive = selectedStyle?.base === group.base;
                        return (
                          <div key={group.base} className={`byj-style-card ${isActive ? 'active' : ''}`} onClick={() => setSelectedStyle(group)}>
                            <div className="byj-style-img-wrap">
                              <img src={version.img} alt={version.alt} loading="lazy" />
                              <div className="byj-style-check-badge">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            </div>
                            <div className="byj-style-info">
                              <span className="byj-style-name">{version.fullTitle}</span>
                              <span className="byj-style-price">+{formatPrice(version.price)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Charms Step */}
                <div className={`byj-step ${activeDesktopStep === 'charms' ? 'open' : ''}`}>
                  <div className="byj-step-header" onClick={() => setActiveStep(activeDesktopStep === 'charms' ? '' : 'charms')}>
                    <div className="byj-step-left">
                      <span className={`byj-step-check ${selectedCharms.length === 0 ? 'pending' : ''}`}>
                        {selectedCharms.length === 0 ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </span>
                      <div>
                        <div className="byj-step-label">CHARMS</div>
                        <div className="byj-step-value">{selectedCharms.reduce((acc, c) => acc + c.qty, 0)} SELECTED</div>
                      </div>
                    </div>
                    <svg className="byj-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div className="byj-step-body">
                    <div className="byj-charm-grid">
                      {charms.map(group => {
                        const version = getActiveVersion(group, material, length);
                        if (!version) return null;
                        const charmState = selectedCharms.find(c => c.base === group.base);
                        const qty = charmState?.qty || 0;
                        return (
                          <div key={group.base} className={`byj-charm-item ${qty > 0 ? 'selected' : ''}`} onClick={() => toggleCharmSelection(group)}>
                            <div className="byj-style-img-wrap">
                              <img src={version.img} alt={version.alt} loading="lazy" />
                              <div className="byj-style-check-badge">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            </div>
                            <div className="byj-style-info">
                              <span className="byj-style-name">{version.fullTitle}</span>
                              <span className="byj-style-price">+{formatPrice(version.price)}</span>
                              <div className="byj-charm-qty-wrap" onClick={(e) => e.stopPropagation()}>
                                <button className="byj-qty-btn minus" onClick={() => updateCharmQty(group.base, -1)}>-</button>
                                <span className="byj-qty-num">{qty}</span>
                                <button className="byj-qty-btn plus" onClick={() => updateCharmQty(group.base, 1)}>+</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="byj-confirm-bar">
              <div className="byj-total-wrap">
                <span className="byj-total-label">Total</span>
                <span className="byj-total-price">{formatPrice(totalPrice)}</span>
              </div>
              <button className="byj-confirm-btn" disabled={!isReady} onClick={handleConfirm}>
                <span>Confirm</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>

          {/* Mobile UI */}
          <div className="byj-mobile-steps">
            <div className="byj-mobile-mat-row">
              <span className="byj-mobile-mat-label">Material: <strong>{MATERIALS.find(m => m.id === material)?.label}</strong></span>
              <div className="byj-mob-swatches">
                {MATERIALS.map(m => (
                  <button key={m.id} className={`byj-mat-btn ${material === m.id ? 'active' : ''}`} onClick={() => setMaterial(m.id)}>
                    <span className="byj-mat-swatch" style={{ background: m.swatch }}></span>
                  </button>
                ))}
              </div>
            </div>

            <div className="byj-mob-row" onClick={() => openDrawer('length')}>
              <div className="flex items-center gap-3">
                <span className="byj-mob-check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a]">Length</div>
                  <div className="text-xs font-bold">{length}</div>
                </div>
              </div>
              <button className="text-[#5a413f]">+</button>
            </div>

            <div className="byj-mob-row" onClick={() => openDrawer('style')}>
              <div className="flex items-center gap-3">
                <span className={`byj-mob-check ${!selectedStyle ? 'pending' : ''}`}>
                  {!selectedStyle ? '!' : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a]">Style</div>
                  <div className="text-xs font-bold truncate max-w-[200px]">{selectedStyle ? getActiveVersion(selectedStyle, material, length)?.fullTitle : `Choose your ${categoryConfig.label}`}</div>
                </div>
              </div>
              <button className="text-[#5a413f]">+</button>
            </div>

            <div className="byj-mob-row" onClick={() => openDrawer('charms')}>
              <div className="flex items-center gap-3">
                <span className={`byj-mob-check ${selectedCharms.length === 0 ? 'pending' : ''}`}>
                  {selectedCharms.length === 0 ? '!' : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a]">Charms</div>
                  <div className="text-xs font-bold">{selectedCharms.reduce((acc, c) => acc + c.qty, 0)} Selected</div>
                </div>
              </div>
              <button className="text-[#5a413f]">+</button>
            </div>

            <div className="byj-mob-confirm-bar">
              <span className="byj-mob-total">{formatPrice(totalPrice)}</span>
              <button className="byj-confirm-btn" disabled={!isReady} onClick={handleConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Drawer (Length, Style, Charms) */}
      <div className={`byj-drawer-overlay ${isDrawerOpen ? 'active' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
      <div className={`byj-right-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="byj-drawer-header">
          <button onClick={() => setIsDrawerOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <span className="byj-drawer-title">{currentDrawerKey.toUpperCase()}</span>
          <div style={{ width: '20px' }}></div>
        </div>
        <div className="byj-drawer-body">
          {currentDrawerKey === 'length' && (
            <div className="byj-option-grid">
              {availableLengths.map(l => (
                <button key={l} className={`byj-opt-btn ${length === l ? 'active' : ''}`} onClick={() => setLength(l)}>{l}</button>
              ))}
            </div>
          )}
          {currentDrawerKey === 'style' && (
            <div className="byj-style-grid">
              {chains.map(group => {
                const version = getActiveVersion(group, material, length);
                if (!version) return null;
                const isActive = selectedStyle?.base === group.base;
                return (
                  <div key={group.base} className={`byj-style-card ${isActive ? 'active' : ''}`} onClick={() => setSelectedStyle(group)}>
                    <div className="byj-style-img-wrap">
                      <img src={version.img} alt={version.alt} loading="lazy" />
                      <div className="byj-style-check-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                    </div>
                    <div className="byj-style-info">
                      <span className="byj-style-name">{version.fullTitle}</span>
                      <span className="byj-style-price">+{formatPrice(version.price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {currentDrawerKey === 'charms' && (
            <div className="byj-charm-grid">
              {charms.map(group => {
                const version = getActiveVersion(group, material, length);
                if (!version) return null;
                const charmState = selectedCharms.find(c => c.base === group.base);
                const qty = charmState?.qty || 0;
                return (
                  <div key={group.base} className={`byj-charm-item ${qty > 0 ? 'selected' : ''}`} onClick={() => toggleCharmSelection(group)}>
                    <div className="byj-style-img-wrap">
                      <img src={version.img} alt={version.alt} loading="lazy" />
                      <div className="byj-style-check-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                    </div>
                    <div className="byj-style-info">
                      <span className="byj-style-name">{version.fullTitle}</span>
                      <span className="byj-style-price">+{formatPrice(version.price)}</span>
                      <div className="byj-charm-qty-wrap" onClick={(e) => e.stopPropagation()}>
                        <button className="byj-qty-btn minus" onClick={() => updateCharmQty(group.base, -1)}>-</button>
                        <span className="byj-qty-num">{qty}</span>
                        <button className="byj-qty-btn plus" onClick={() => updateCharmQty(group.base, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="byj-drawer-footer">
          <button className="byj-drawer-done" onClick={() => setIsDrawerOpen(false)}>Done</button>
        </div>
      </div>

      {/* Summary / Mini Cart Drawer */}
      <div className={`byj-drawer-overlay ${isSummaryOpen ? 'active' : ''}`} onClick={() => setIsSummaryOpen(false)}></div>
      <div className={`byj-right-drawer ${isSummaryOpen ? 'open' : ''}`}>
        <div className="byj-drawer-header">
           <span className="byj-drawer-title font-bold text-sm tracking-widest">HERE'S YOUR SUMMARY</span>
          <button onClick={() => setIsSummaryOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="byj-drawer-body !p-0">
          <div className="byj-summary-scroll px-6 py-6">
            {canvasPreview && (
              <div className="byj-summary-preview mb-8 bg-[#fafafa] p-4 rounded-2xl border border-[#f0f0f0] shadow-inner">
                <img src={canvasPreview} alt="BYJ Preview" className="w-full h-auto aspect-square object-contain" />
              </div>
            )}
            
            <div className="byj-summary-details space-y-6">
              <div className="byj-summary-row border-b border-[#f0f0f0] pb-3">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a413f] opacity-80">Product Type</span>
                </div>
                <div className="text-[15px] font-semibold text-[#1c1810]">{categoryConfig.label}</div>
              </div>

              <div className="byj-summary-row border-b border-[#f0f0f0] pb-3">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a413f] opacity-80">Style Selection</span>
                  <span className="text-sm font-bold text-[#5a413f]">{formatPrice(getActiveVersion(selectedStyle, material, length)?.price)}</span>
                </div>
                <div className="text-[15px] font-semibold text-[#1c1810]">{getActiveVersion(selectedStyle, material, length)?.fullTitle}</div>
              </div>

              <div className="byj-summary-row border-b border-[#f0f0f0] pb-3">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a413f] opacity-80">Size / Length</span>
                </div>
                <div className="text-[15px] font-semibold text-[#1c1810]">{length}</div>
              </div>

              <div className="byj-summary-row border-b border-[#f0f0f0] pb-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a413f] opacity-80">Charms Added</span>
                  <span className="text-xs font-bold text-gray-400">{selectedCharms.reduce((acc, c) => acc + c.qty, 0)} Items</span>
                </div>
                <div className="space-y-3 mt-3">
                  {(() => {
                    const flatList = [];
                    selectedCharms.forEach(c => {
                      for (let i = 0; i < c.qty; i++) flatList.push(c);
                    });
                    return flatList.map((c, i) => (
                      <div key={`${c.base}-${i}`} className="flex justify-between items-start group">
                        <span className="text-sm font-medium text-[#1c1810] flex-1">{i + 1}. {c.fullTitle}</span>
                        <span className="text-sm font-bold text-[#5a413f] ml-3">{formatPrice(c.price)}</span>
                      </div>
                    ));
                  })()}
                  <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 uppercase tracking-widest font-bold">
                    <span>Standard Spacing Applied</span>
                    <span>~2.5cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="byj-drawer-footer border-t border-[#f0f0f0] bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6 px-2">
            <span className="text-xs font-bold text-[#5a413f] uppercase tracking-widest">Subtotal Estimate</span>
            <span className="text-2xl font-extrabold text-[#1c1810]">{formatPrice(totalPrice)}</span>
          </div>
          <button 
            className="byj-confirm-btn w-full !rounded-xl h-14 uppercase tracking-widest shadow-xl shadow-[#5a413f]/10" 
            disabled={addingToBag}
            onClick={handleAddToBag}
          >
            {addingToBag ? 'Adding to Bag...' : 'Add to Bag'}
            {!addingToBag && <svg width="18" height="18" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
              <path d="M4.22112 5.35692C4.22112 5.35692 3.81759 0.589355 7.85288 0.589355C11.8882 0.589355 11.4846 5.35692 11.4846 5.35692M0.589355 17.2758L1.33747 4.90168C1.37058 4.35392 1.82446 3.92665 2.37322 3.92665H13.3371C13.884 3.92665 14.3369 4.34892 14.3722 4.89468C14.654 9.25047 15.1164 16.5686 15.1164 17.2758C15.1164 18.0386 14.5784 18.2294 14.3094 18.2294C10.2741 18.2294 2.04206 18.2294 1.39641 18.2294C0.750767 18.2294 0.589355 17.5937 0.589355 17.2758Z" stroke="white" strokeWidth="1.5" strokeLinecap="round"></path>
            </svg>}
          </button>
        </div>
      </div>
    </div>
  );
}

