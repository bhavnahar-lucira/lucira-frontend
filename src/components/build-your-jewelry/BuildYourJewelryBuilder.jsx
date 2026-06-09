'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Konva from 'konva';
import { shopifyStorefrontFetch } from '@/lib/shopify-client';

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
  if (t.includes('18k') || t.includes('18ct')) return '18KT';
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
  const [currentDrawerKey, setCurrentDrawerKey] = useState('');
  const [loading, setLoading] = useState(true);

  // Konva Refs
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  const productImgRef = useRef(null);
  const charmGroupRef = useRef(null);
  const [zoom, setZoom] = useState(1);

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
          products.forEach(({ node: p }) => {
            const variants = p.variants?.edges || [];
            variants.forEach(({ node: v }) => {
              const fullTitle = `${p.title} - ${v.title}`;
              const base = getBaseName(fullTitle);
              if (!groups[base]) {
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
          return Object.values(groups);
        };

        setChains(groupProducts(chainRes));
        setCharms(groupProducts(charmRes));
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
      for (let i = 0; i < c.qty; i++) {
        flat.push({ src: c.img, handle: c.handle, base: c.base });
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
    return colorVersions[karat] || Object.values(colorVersions)[0];
  };

  useEffect(() => {
    if (selectedStyle) {
      const v = getActiveVersion(selectedStyle, material, length);
      updateCanvasImage(v?.img);
    }
  }, [selectedStyle, material, length]);

  useEffect(() => {
    renderCharms();
  }, [selectedCharms, material, length]);

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

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: center.x - relatedToCenter.x * newScale,
      y: center.y - relatedToCenter.y * newScale,
    });
    setZoom(newScale);
    stage.batchDraw();
  };

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
      const totalCount = prev.reduce((acc, c) => acc + c.qty, 0);
      if (delta > 0 && totalCount >= MAX_CHARMS) {
        alert(`Max ${MAX_CHARMS} charms allowed`);
        return prev;
      }

      return prev.map(c => {
        if (c.base === base) {
          const newQty = Math.max(0, c.qty + delta);
          return newQty === 0 ? null : { ...c, qty: newQty };
        }
        return c;
      }).filter(Boolean);
    });
  };

  const totalPrice = useMemo(() => {
    const styleV = getActiveVersion(selectedStyle, material, length);
    const sPrice = parseFloat(styleV?.price || 0);
    const cPrice = selectedCharms.reduce((acc, c) => {
      // Find the group to get updated price based on current state
      const group = charms.find(g => g.base === c.base);
      const v = getActiveVersion(group, material, length);
      return acc + (parseFloat(v?.price || 0) * c.qty);
    }, 0);
    return sPrice + cPrice;
  }, [selectedStyle, selectedCharms, material, length, charms]);

  const isReady = selectedStyle && selectedCharms.reduce((acc, c) => acc + c.qty, 0) >= MIN_CHARMS;

  const openDrawer = (key) => {
    setCurrentDrawerKey(key);
    setIsDrawerOpen(true);
  };

  const containerStyle = {
  };

  return (
    <div className="build-your-jewelry-bracelets">
      <style jsx global>{`
        .build-your-jewelry-bracelets { color: #1c1810; background: #fef5f1; font-family: Figtree, sans-serif; }
        .byj-layout { display: grid; grid-template-columns: 1fr 400px; grid-template-areas: "canvas panel"; min-height: 100vh; }
        .byj-canvas-area { grid-area: canvas; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; padding: 0px 24px; min-height: 60vh; }
        .byj-canvas-area.has-bg { background-image: url(https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Q1PartB2953_37dd8896-3ea2-4c65-8c86-707f5cacb9b3.webp?v=1780657459); background-size: cover; background-position: center; }
        #byj-konva-container { width: 100%; max-width: 540px; aspect-ratio: 1; cursor: grab; border-radius: 12px; overflow: hidden; touch-action: none; }
        .byj-canvas-controls { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.92); border: 1px solid #e0d0ba; border-radius: 100px; padding: 6px 14px; box-shadow: 0 2px 16px rgba(0,0,0,.08); backdrop-filter: blur(4px); z-index: 20; }
        .byj-ctrl-btn { width: 30px; height: 30px; border: none; background: transparent; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #1c1810; transition: background .15s; }
        .byj-zoom-track { width: 80px; height: 4px; background: #e0d0ba; border-radius: 2px; position: relative; }
        .byj-zoom-thumb { width: 12px; height: 12px; border-radius: 50%; background: #1c1810; position: absolute; top: 50%; transform: translate(-50%,-50%); transition: left .15s; display: block; }
        .byj-config-panel { grid-area: panel; background: transparent; border-left: 1px solid #e0d0ba; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; overflow: hidden; }
        .byj-panel-scroll { flex: 1; overflow-y: auto; scrollbar-width: thin; }
        .byj-material-bar { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #e0d0ba; background: transparent; }
        .byj-material-label, .byj-mat-name { font-size: 14px; color: #000; font-weight: 500; }
        .byj-mat-btn { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid transparent; padding: 0; background: transparent; cursor: pointer; transition: border-color .2s; }
        .byj-mat-btn.active { border-color: #1c1810; }
        .byj-mat-swatch { display: block; width: 100%; height: 100%; border-radius: 50%; }
        .byj-step { border-bottom: 1px solid #e0d0ba; }
        .byj-step-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; cursor: pointer; user-select: none; transition: background .15s; }
        .byj-step-header:hover { background: rgba(0,0,0,0.03); }
        .byj-step-left { display: flex; align-items: flex-start; gap: 11px; }
        .byj-step-check { width: 20px; height: 20px; border-radius: 50%; background: #5a413f; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .byj-step-check.pending { background: transparent; color: #5a413f; border: 1.5px solid #e0d0ba; }
        .byj-step-label { font-size: 12px; color: #000; font-weight: 600; margin-bottom: 2px; letter-spacing: .05em; }
        .byj-step-value { font-size: 12px; color: #5a413f; }
        .byj-chevron { transition: transform .28s ease; color: #5a413f; }
        .byj-step.open .byj-chevron { transform: rotate(180deg); }
        .byj-step-body { padding: 0 20px 20px; display: none; }
        .byj-step.open .byj-step-body { display: block; }
        .byj-confirm-bar { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-top: 1px solid #e0d0ba; background: transparent; z-index: 10; width: 100%; }
        .byj-total-wrap { display: flex; flex-direction: column; }
        .byj-total-label { font-size: 10px; color: #5a413f; text-transform: uppercase; letter-spacing: .05em; }
        .byj-total-price { font-size: 18px; font-weight: 700; color: #1c1810; }
        .byj-confirm-btn { flex: 1; height: 46px; background: #1c1810; color: #fff; border: none; border-radius: 100px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; transition: all .2s; }
        .byj-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .byj-option-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .byj-opt-btn { padding: 6px 16px; border: 1px solid #e0d0ba; border-radius: 100px; font-size: 12px; cursor: pointer; background: transparent; transition: all .2s; }
        .byj-opt-btn.active { background: #5a413f; border-color: #5a413f; color: #fff; }
        .byj-style-grid, .byj-charm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .byj-style-card, .byj-charm-item { border: 1px solid transparent; border-radius: 10px; overflow: hidden; cursor: pointer; background: rgba(255,255,255,0.4); transition: all .25s ease; display: flex; flex-direction: column; position: relative; }
        .byj-style-card:hover, .byj-charm-item:hover { border-color: #d4a853; box-shadow: 0 4px 15px rgba(201,148,58,.12); transform: translateY(-2px); }
        .byj-style-card.active, .byj-charm-item.selected { border-color: #5a413f; }
        .byj-style-img-wrap { position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: transparent; border-bottom: 1px solid rgba(0,0,0,0.05); padding: 12px; }
        .byj-style-img-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .byj-style-check-badge { position: absolute; top: 10px; left: 10px; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #e0d0ba; background: transparent; display: flex; align-items: center; justify-content: center; z-index: 2; color: transparent; }
        .byj-style-card.active .byj-style-check-badge, .byj-charm-item.selected .byj-style-check-badge { background: #5a413f; border-color: #5a413f; color: #fff; }
        .byj-style-info { padding: 12px; display: flex; flex-direction: column; gap: 6px; flex: 1; justify-content: space-between; }
        .byj-style-name { font-size: 12px; font-weight: 600; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .byj-style-price { font-size: 14px; font-weight: 700; margin-top: auto; }
        .byj-charm-qty-wrap { display: flex; align-items: center; justify-content: space-between; width: 100%; background: rgba(0,0,0,0.05); margin-top: 5px; border-radius: 8px; overflow: hidden; }
        .byj-qty-btn { background: transparent; border: none; width: 32px; height: 32px; font-size: 18px; color: #1c1810; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .byj-qty-btn:hover { background: #e0d0ba; }
        .byj-qty-num { font-size: 13px; font-weight: 700; min-width: 24px; text-align: center; }
        .byj-mobile-steps { display: none; }
        .byj-mob-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: transparent; border-bottom: 1px solid #e0d0ba; }
        .byj-mob-check { width: 20px; height: 20px; border-radius: 50%; background: #4e8a56; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .byj-mob-check.pending { background: transparent; color: #e0d0ba; border: 1.5px solid #e0d0ba; }
        .byj-right-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 88vw; max-width: 400px; background: #fef5f1; z-index: 1101; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .38s cubic-bezier(.32,.72,0,1); }
        .byj-right-drawer.open { transform: translateX(0); }
        .byj-drawer-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1100; }
        .byj-drawer-overlay.active { display: block; }
        .byj-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #e0d0ba; background: transparent; }
        .byj-drawer-body { flex: 1; overflow-y: auto; padding: 16px; }
        .byj-drawer-footer { padding: 16px; border-top: 1px solid #e0d0ba; background: transparent; }
        .byj-drawer-done { width: 100%; height: 46px; background: #1c1810; color: #fff; border: none; border-radius: 100px; cursor: pointer; font-weight: 600; }
        
        @media (max-width: 860px) {
          .byj-layout { grid-template-columns: 1fr; grid-template-areas: "canvas" "mobile-steps"; min-height: unset; }
          .byj-canvas-area { padding: 0 0 16px; }
          .byj-config-panel { display: none !important; }
          .byj-mobile-steps { display: block; grid-area: mobile-steps; background: transparent; }
          .byj-mobile-mat-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: transparent; border-bottom: 1px solid #e0d0ba; }
          .byj-mob-swatches { display: flex; gap: 8px; }
          .byj-mob-confirm-bar { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: transparent; border-top: 2px solid #e0d0ba; }
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
                      {LENGTHS.map(l => (
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
              <button className="byj-confirm-btn" disabled={!isReady}>
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
              <button className="byj-confirm-btn" disabled={!isReady}>Confirm</button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
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
              {LENGTHS.map(l => (
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
    </div>
  );
}
