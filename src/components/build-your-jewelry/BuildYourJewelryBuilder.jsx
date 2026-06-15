'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Konva from 'konva';
import { shopifyStorefrontFetch } from '@/lib/shopify-client';
import { useCart } from '@/hooks/useCart';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight } from 'lucide-react';

const CHAIN_COLLECTION_HANDLE = 'byj-chains';
const CHARM_COLLECTIONS = [
  { handle: 'byj-faraways-charms', title: 'Faraways Charms' },
  { handle: 'byj-fairytrails-charm', title: 'Fairytrails Charm' },
  { handle: 'byj-initials-charm', title: 'Initials Charm' },
];

const GET_COLLECTION_QUERY = `
  query getCollectionByHandle($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      title
      handle
      image {
        url
        altText
      }
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
                  sku
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
  }).format(value / 100); 
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
  const isMobile = useMediaQuery('(max-width: 860px)');

  const [material, setMaterial] = useState('9k-gold');
  const [length, setLength] = useState('14KT');
  const [chains, setChains] = useState([]);
  const [allCharmCollections, setAllCharmCollections] = useState({});
  const [charmCollectionsInfo, setCharmCollectionsInfo] = useState([]);
  const [activeCharmCollection, setActiveCharmCollection] = useState('byj-faraways-charms');
  const [charms, setCharms] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedCharms, setSelectedCharms] = useState([]);
  const [activeDesktopStep, setActiveStep] = useState('length');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [canvasPreview, setCanvasPreview] = useState(null);
  const [currentDrawerKey, setCurrentDrawerKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingToBag, setAddingToBag] = useState(false);

  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  const productImgRef = useRef(null);
  const charmGroupRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const [chainRes, ...charmResponses] = await Promise.all([
          shopifyStorefrontFetch(GET_COLLECTION_QUERY, { handle: CHAIN_COLLECTION_HANDLE, first: 250 }),
          ...CHARM_COLLECTIONS.map(c => shopifyStorefrontFetch(GET_COLLECTION_QUERY, { handle: c.handle, first: 250 }))
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
                sku: v.sku || '',
                price: parseFloat(v.price.amount) * 100, 
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

        const charmDataMap = {};
        const charmInfoList = [];

        charmResponses.forEach((res, index) => {
          const colDef = CHARM_COLLECTIONS[index];
          const handle = colDef.handle;
          
          if (!res || !res.collection) {
            console.warn(`[BYJ] Collection not found in Storefront: ${handle}`);
            charmDataMap[handle] = [];
            charmInfoList.push({
              handle,
              title: colDef.title,
              img: null
            });
            return;
          }

          const groupedCharms = groupProducts(res).sort((a, b) => a.base.localeCompare(b.base));
          charmDataMap[handle] = groupedCharms;
          
          // Image Selection Strategy:
          // 1. Collection image (if set)
          // 2. First product's featured image
          // 3. First product's first variant image
          const firstProductNode = res.collection.products?.edges?.[0]?.node;
          const firstProductImg = firstProductNode?.featuredImage?.url || firstProductNode?.variants?.edges?.[0]?.node?.image?.url;
          const collectionImg = res.collection.image?.url;

          charmInfoList.push({
            handle,
            title: res.collection.title || colDef.title,
            img: collectionImg || firstProductImg || 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/logo.svg?v=1781175000' // Placeholder
          });
        });

        setChains(groupProducts(chainRes));
        setAllCharmCollections(charmDataMap);
        setCharmCollectionsInfo(charmInfoList);
        setCharms(charmDataMap[activeCharmCollection] || []);
      } catch (err) {
        console.error('Failed to load BYJ data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (allCharmCollections[activeCharmCollection]) {
      setCharms(allCharmCollections[activeCharmCollection]);
    }
  }, [activeCharmCollection, allCharmCollections]);

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
      const clampedScale = Math.max(0.5, Math.min(2.5, newScale));
      
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

  const getActiveVersion = (group, matId, karat) => {
    if (!group) return null;
    const mat = MATERIALS.find(m => m.id === matId);
    const keyword = mat?.keyword || 'yellow';
    const colorVersions = group.versions[keyword] || group.versions['yellow'] || Object.values(group.versions)[0];
    if (!colorVersions) return null;
    return colorVersions[karat] || null;
  };

  const findCharmGroup = (base) => {
    // Search in currently active collection first (optimization)
    const activeMatch = charms.find(c => c.base === base);
    if (activeMatch) return activeMatch;
    
    // Search in all other collections
    for (const handle in allCharmCollections) {
      const found = allCharmCollections[handle].find(c => c.base === base);
      if (found) return found;
    }
    return null;
  };

  const renderCharms = () => {
    const group = charmGroupRef.current;
    if (!group || !productImgRef.current) return;
    group.destroyChildren();

    const flat = [];
    selectedCharms.forEach(c => {
      const charmData = findCharmGroup(c.base);
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
                const charmData = findCharmGroup(base);
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

        ci.on('click tap', function() {
          setSelectedCharms(prev => {
            const flatHandles = [];
            prev.forEach(c => {
              for (let j = 0; j < c.qty; j++) flatHandles.push(c.base);
            });
            flatHandles.splice(idx, 1);
            const newCharms = [];
            flatHandles.forEach(base => {
              const charmData = findCharmGroup(base);
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
        });

        group.add(ci);
        layerRef.current.batchDraw();
      };
      charmImg.src = item.src;
    });
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
        const group = findCharmGroup(c.base);
        const version = getActiveVersion(group, material, length);
        return version ? { ...version, base: c.base, qty: c.qty } : c;
      }));
    }
  }, [material, length]);

  const handleZoom = (factor) => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const newScale = Math.max(0.5, Math.min(2.5, oldScale * factor));
    
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

  const handleSliderChange = (e) => {
    const newScale = parseFloat(e.target.value);
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    const center = { x: stage.width() / 2, y: stage.height() / 2 };
    const relatedToCenter = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    stage.scaleX(newScale);
    stage.scaleY(newScale);
    stage.x(center.x - relatedToCenter.x * newScale);
    stage.y(center.y - relatedToCenter.y * newScale);
    stage.batchDraw();
    setZoom(newScale);
  };

  const zoomToCharms = () => {
    const stage = stageRef.current;
    const img = productImgRef.current;
    if (!stage || !img) return;

    const width = stage.width();
    const height = stage.height();
    const targetScale = 1.8;
    
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
    const totalQty = selectedCharms.reduce((acc, c) => acc + c.qty, 0);
    if (totalQty === 1) {
      zoomToCharms();
    } else if (totalQty === 0) {
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

      if (delta > 0 && !existing) {
        const charmData = findCharmGroup(base);
        const version = getActiveVersion(charmData, material, length);
        newCharms.push({ ...version, base, qty: 1 });
      }

      return newCharms;
    });
  };

  const totalPrice = useMemo(() => {
    const styleV = getActiveVersion(selectedStyle, material, length);
    if (!styleV) return 0;
    
    let total = parseFloat(styleV.price || 0); 
    
    selectedCharms.forEach(c => {
      const group = findCharmGroup(c.base);
      const version = getActiveVersion(group, material, length);
      if (version) {
        total += parseFloat(version.price || 0) * c.qty; 
      }
    });
    
    return total;
  }, [selectedStyle, selectedCharms, material, length, allCharmCollections]);

  const isReady = selectedStyle && selectedCharms.reduce((acc, c) => acc + c.qty, 0) >= MIN_CHARMS;

  const openDrawer = (key) => {
    setCurrentDrawerKey(key);
    setIsDrawerOpen(true);
  };

  const handleConfirm = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const oldPos = stage.position();

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();

    // Add a temporary white background for JPEG export to ensure no black background
    const background = new Konva.Rect({
      x: 0,
      y: 0,
      width: stage.width(),
      height: stage.height(),
      fill: 'white',
      listening: false
    });
    
    // Find the first layer or the one containing elements
    const layer = stage.getLayers()[0];
    if (layer) {
      layer.add(background);
      background.moveToBottom();
      layer.draw();
    }

    // Aggressively reduce resolution and quality to stay well under Shopify's character limits.
    // 150x150 at 0.3 quality JPEG is roughly 3-5KB, which is ~4-7KB in Base64.
    const dataURL = stage.toDataURL({ 
      pixelRatio: 150 / stage.width(), 
      mimeType: 'image/jpeg',
      quality: 0.3
    });

    if (layer) {
      background.destroy();
      layer.draw();
    }

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
      const groupId = `BYJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; 
      const charmDetails = selectedCharms.map((c, i) => `${i + 1}. ${c.fullTitle}`).join(', ');
      
      // Extremely minimized properties to stay under Shopify's payload and attribute limits.
      const properties = {
        'Product Type': categoryConfig.label,
        'Style': styleV.fullTitle,
        'Length': length,
        'Material': MATERIALS.find(m => m.id === material)?.label,
        'Charms': charmDetails,
        '_byj_group_id': groupId,
        '_byj_preview': canvasPreview,
        '_byj_charms_json': JSON.stringify(selectedCharms.map(c => ({ qty: c.qty, sku: c.sku })))
      };

      const mainItem = {
        id: styleV.id,
        title: 'Bespoke Story Chain',
        quantity: 1,
        price: styleV.price / 100,
        finalPrice: styleV.price / 100,
        sku: styleV.sku,
        properties
      };

      const charmItems = selectedCharms.map(c => ({
       id: c.id,
       title: `Charm: ${c.fullTitle}`,
       quantity: c.qty,
       price: c.price / 100,
       finalPrice: c.price / 100,
       sku: c.sku,
       properties: {
         '_byj_group_id': groupId,
         '_byj_parent': styleV.id
       }
      }));

      await addToCart({
        products: [mainItem, ...charmItems]
      });
      
      setIsSummaryOpen(false);
      router.push('/cart');
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
        .build-your-jewelry-bracelets {color: #1c1810; font-family: var(--font-figtree), sans-serif; background: #ffffff;}
        .byj-layout { display: grid; grid-template-columns: 1fr 500px; grid-template-areas: "canvas panel"; min-height: 100vh; max-width: 100vw; margin: 0 auto; overflow: hidden;}
        
        footer, 
        .zsiq_float_main, 
        #zsiq_float_container,
        .fixed.z-\[499\] { display: none !important; }

        .byj-canvas-area { grid-area: canvas; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; padding: 0px 24px; min-height: 60vh; }
        .byj-canvas-area.has-bg { background-image: url(https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Pexels_Photo_by_Maryam.jpg?v=1781247551); background-size: cover; background-position: center; }
        #byj-konva-container { width: 100%; max-width: 540px; aspect-ratio: 1; cursor: grab; border-radius: 20px; overflow: hidden; touch-action: none;}
        
        .byj-canvas-controls { position: absolute; bottom: 30px; right: 30px; display: flex; align-items: center; gap: 12px; z-index: 20; }
        .byj-zoom-bar { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 100px; padding: 6px 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #f0ebe4; }
        .byj-ctrl-btn { width: 34px; height: 34px; border: none; background: #fff; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #1c1810; transition: all .2s cubic-bezier(.4,0,.2,1); }
        .byj-ctrl-btn:hover { background: #fdfaf7; transform: translateY(-1px) scale(1.05); }
        .byj-zoom-slider { -webkit-appearance: none; width: 100px; height: 3px; background: #f0ebe4; border-radius: 10px; outline: none; cursor: pointer; }
        .byj-zoom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #1c1810; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); transition: transform 0.2s; }
        .byj-zoom-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #1c1810; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); border: none; transition: transform 0.2s; }
        .byj-zoom-slider:active::-webkit-slider-thumb { transform: scale(1.2); }
        .byj-zoom-slider:active::-moz-range-thumb { transform: scale(1.2); }
        
        .byj-help-btn-wrap { position: relative; }
        .byj-help-btn { width: 44px; height: 44px; border: 1px solid rgba(224,208,186,0.8); background: #fff; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #1c1810; box-shadow: 0 4px 20px rgba(0,0,0,.06); font-size: 15px; font-weight: 600; transition: all .2s; }
        .byj-help-btn:hover { background: #fdfaf7; border-color: #5a413f; }
        .byj-help-tooltip { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(10px); margin-bottom: 12px; background: #1c1810; color: #fff; padding: 10px 18px; border-radius: 6px; font-size: 9px; font-weight: 700; width: max-content; max-width: 220px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,.2); pointer-events: none; transition: all .3s cubic-bezier(.4,0,.2,1); opacity: 0; visibility: hidden; z-index: 100; letter-spacing: 0.1em; line-height: 1.5; }
        .byj-help-tooltip.show { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
        .byj-help-tooltip::after { content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border-width: 6px; border-style: solid; border-color: #1c1810 transparent transparent transparent; }

        @media (max-width: 860px) {
          .byj-help-tooltip { left: auto; right: 0; transform: translateY(10px); }
          .byj-help-tooltip.show { transform: translateY(0); }
          .byj-help-tooltip::after { left: auto; right: 15px; transform: none; }
        }

        .byj-config-panel { grid-area: panel; background: #fff; border-left: 1px solid #e0d0ba; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; overflow: hidden; box-shadow: -10px 0 50px rgba(0,0,0,0.02); }
        .byj-panel-scroll { flex: 1; overflow-y: auto; scrollbar-width: thin; scroll-behavior: smooth; }
        
        .byj-confirm-bar { position: sticky; bottom: 0; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 30px; border-top: 1px solid #f0ebe4; background: #fff; z-index: 10; width: 100%; box-shadow: 0 -10px 40px rgba(0,0,0,0.04); }
        .byj-total-wrap { display: flex; flex-direction: column; }
        .byj-total-label { font-size: 8px; color: #8a8a8a; text-transform: uppercase; letter-spacing: .05em; font-weight: 700; margin-bottom: 4px; }
        .byj-total-price {color: #1c1810; font-weight: 700; font-family: 'Figtree', sans-serif; font-size: 16px; line-height: 1;}
        .byj-confirm-btn {color: #fff !important; letter-spacing: .12em !important; text-transform: uppercase !important; background: #5a413f !important; border-radius: 100px !important; align-items: center !important; gap: 10px !important; height: 40px !important; padding: 0 40px !important; font-size: 12px !important; font-weight: 700 !important; transition: all .3s !important; display: flex !important;}
        .byj-confirm-btn:hover:not(:disabled) { background: #4a312f !important; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(90,65,63,0.2); }
        .byj-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .byj-material-bar { display: flex; align-items: center; gap: 15px; padding: 24px 25px; border-bottom: 1px solid #f0ebe4; background: #fff; }
        .byj-material-label {color: #5a413f; letter-spacing: .2px; text-transform: uppercase; margin-bottom: 3px; font-size: 12px; font-weight: 700;}
        .byj-mat-btn { width: 36px; height: 36px; border-radius: 50%; border: 2px solid transparent; padding: 2px; background: transparent; cursor: pointer; transition: all .2s; }
        .byj-mat-btn.active { border-color: #1c1810; transform: scale(1); width: 32px; height: 32px;}
        .byj-mat-swatch { display: block; width: 100%; height: 100%; border-radius: 50%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
        .byj-mat-name { font-size: 13px; color: #1c1810; font-weight: 600; margin-left: auto; }

        .byj-step { border-bottom: 1px solid #f0ebe4; transition: background .3s; }
        .byj-step.open { background: #fdfaf7; }
        .byj-step-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 25px; cursor: pointer; user-select: none; }
        .byj-step-left { display: flex; align-items: center; gap: 14px; }
        .byj-step-check { width: 22px; height: 22px; border-radius: 50%; background: #59403e; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .3s; }
        .byj-step-check.pending { background: transparent; color: #e0d0ba; border: 1.5px solid #e0d0ba; }
        .byj-step-label { font-size: 11px; color: #5a413f; font-weight: 700; margin-bottom: 3px; letter-spacing: 0.2px; text-transform: uppercase; }
        .byj-step-value { font-size: 12px; color: #1c1810; font-weight: 500; }
        .byj-chevron { transition: transform .4s cubic-bezier(.4,0,.2,1); color: #5a413f; opacity: 0.6; }
        .byj-step.open .byj-chevron { transform: rotate(180deg); opacity: 1; }
        .byj-step-body { padding: 0 25px 20px; display: none; }
        .byj-step.open .byj-step-body { display: block; animation: fadeIn .4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        .byj-option-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .byj-opt-btn { padding: 8px 20px; border: 1.5px solid #f0ebe4; border-radius: 100px; padding: 4px 18px; font-size: 12px; font-weight: 600; transition: all .2s; color: #5a413f; }
        .byj-opt-btn:hover { border-color: #e0d0ba; background: #fdfaf7; }
        .byj-opt-btn.active { background: #59403f; border-color: #59403f; color: #fff; transform: scale(1.05); }

        .byj-collection-circles { display: flex; gap: 20px; overflow-x: auto; padding: 5px 5px 20px; margin-bottom: 10px; scrollbar-width: none; -ms-overflow-style: none; }
        .byj-collection-circles::-webkit-scrollbar { display: none; }
        .byj-collection-circle-item { flex-shrink: 0; width: 85px; text-align: center; cursor: pointer; transition: all 0.3s cubic-bezier(.4,0,.2,1); }
        .byj-collection-circle-img-wrap { width: 75px; height: 75px; border-radius: 50%; border: 2px solid #f0ebe4; overflow: hidden; margin: 0 auto 10px; transition: all 0.3s; background: #fff; padding: 2px; }
        .byj-collection-circle-item.active .byj-collection-circle-img-wrap { border-color: #5a413f; box-shadow: 0 4px 15px rgba(90,65,63,0.15); transform: translateY(-2px); }
        .byj-collection-circle-img-wrap img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .byj-collection-circle-title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #8a8a8a; letter-spacing: 0.05em; line-height: 1.2; }
        .byj-collection-circle-item.active .byj-collection-circle-title { color: #5a413f; }

        .byj-style-grid, .byj-charm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 16px; border-top: 1px solid #eaeaea;}
        .byj-style-card, .byj-charm-item { border: 1px solid #f0ebe4; border-radius: 4px; overflow: hidden; cursor: pointer; background: #fff; transition: all .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; position: relative; }
        .byj-style-card:hover, .byj-charm-item:hover { border-color: #e0d0ba; transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .byj-style-card.active, .byj-charm-item.selected { border-color: #5a413f; background: #fff;  border-color: #5a413f;}
        .byj-style-img-wrap { position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #ffffff; padding: 6px; overflow: hidden; }
        .byj-style-img-wrap img { width: 100%; height: 100%; object-fit: contain; transition: transform .5s ease; }
        .byj-style-card:hover .byj-style-img-wrap img, .byj-charm-item:hover .byj-style-img-wrap img { transform: scale(1.08); }
        .byj-style-check-badge { position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid #f0ebe4; background: #fff; display: flex; align-items: center; justify-content: center; z-index: 2; color: transparent; transition: all .3s; }
        .byj-style-card.active .byj-style-check-badge, .byj-charm-item.selected .byj-style-check-badge {background: #59403f; border-color: #59403f; color: #fff; }
        
        .byj-style-info { padding: 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .byj-style-name { font-size: 13px; font-weight: 500; line-height: 1.3; color: #1c1810; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .byj-style-price { font-size: 15px; font-weight: 700; color: #1c1810; margin-top: auto; }
        
        .byj-charm-qty-wrap {background: #fafafa; border-radius: 8px; justify-content: space-between; align-items: center; width: 100%; margin-top: 0; padding: 2px; display: flex; overflow: hidden;}
        .byj-qty-btn { background: transparent; border: none; width: 32px; height: 32px; font-size: 18px; color: #1c1810; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s; border-radius: 50%; }
        .byj-qty-btn:hover { background: #fff; }
        .byj-qty-num { font-size: 14px; font-weight: 800; min-width: 28px; text-align: center; color: #1c1810; }

        .byj-right-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; background: #fff; z-index: 1101; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .5s cubic-bezier(.32,.72,0,1); border-left: 1px solid #f0ebe4; box-shadow: -20px 0 60px rgba(0,0,0,0.1); }
        .byj-right-drawer.open { transform: translateX(0); }
        .byj-drawer-overlay { display: none; position: fixed; inset: 0; background: rgba(28,24,16,0.3); backdrop-filter: blur(4px); z-index: 1100; }
        .byj-drawer-overlay.active { display: block; }

        .byj-drawer-header {border-bottom: 1px solid #f0ebe4; justify-content: space-between; align-items: center; padding: 8px 30px; display: flex;}
        .byj-drawer-title { font-size: 12px; font-weight: 800; letter-spacing: 0.15em; color: #1c1810; text-transform: uppercase; }
        .byj-close-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s; color: #5a413f; }
        .byj-close-btn:hover { background: #fdfaf7; color: #1c1810; }
        
        .byj-drawer-body { flex: 1; overflow-y: auto; padding: 0; scrollbar-width: thin; }
        .byj-summary-scroll { padding: 20px; }
        .byj-summary-preview { border-radius: 18px; background: #fef5f17d; padding: 0px; border: 1px solid #fef5f17d; margin-bottom: 20px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02); }
        .byj-summary-preview img { border-radius: 10px; mix-blend-mode: multiply; width: 100%; height: auto; object-fit: cover; }

        .byj-summary-details { border-top: 1px solid #f0ebe4; }
        .byj-summary-row { padding: 20px 0; border-bottom: 1px dotted #e0d0ba; }
        .byj-sum-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #5a413f; letter-spacing: 0.12em; margin-bottom: 8px; display: block; }
        .byj-sum-val { font-size: 14px; font-weight: 600; color: #1c1810; }
        .byj-sum-price { font-size: 14px; font-weight: 700; color: #1c1810; margin-left: auto; }
        
        .byj-summary-charms-list { margin-top: 12px; }
        .byj-sum-charm-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
        .byj-sum-charm-img { width: 44px; height: 44px; border-radius: 8px; background: #fcf9f6; padding: 4px; border: 1px solid #f0ebe4; }
        .byj-sum-charm-info { flex: 1; }
        .byj-sum-charm-name { font-size: 13px; font-weight: 600; display: block; color: #1c1810; }
        .byj-sum-charm-qty { font-size: 11px; color: #5a413f; font-weight: 500; }

        .byj-drawer-footer { padding: 10px 20px 10px; background: #fff; border-top: 1px solid #f0ebe4; }
        .byj-subtotal-row {justify-content: space-between; align-items: baseline; margin-bottom: 10px; display: flex;}
        .byj-subtotal-label { font-size: 13px; font-weight: 600; color: #5a413f; }
        .byj-subtotal-price { color: #1c1810; font-family: var(--font-abhaya), serif;     font-size: 16px; font-weight: 700; font-family: 'Figtree', sans-serif; }

        @media (max-width: 1024px) {
          .byj-layout { grid-template-columns: 1fr 360px; }
        }

        @media (max-width: 860px) {
          .byj-layout { grid-template-columns: 1fr; grid-template-areas: "canvas" "mobile-steps"; min-height: unset; background: #fff; }
          .byj-canvas-area { padding: 20px 16px 40px; min-height: 50vh; }
          #byj-konva-container { max-width: 100%; border-radius: 16px; }
          .byj-config-panel { display: none !important; }
          .byj-mobile-steps { display: block !important; grid-area: mobile-steps; background: #fff; border-top: 1px solid #f0ebe4; padding-bottom: 0px; }
          .byj-mobile-mat-row { display: flex; align-items: center; justify-content: space-between; padding: 20px; border-bottom: 1px solid #f0ebe4; }
          .byj-mob-swatches { display: flex; gap: 10px; align-items: center; }
          .byj-mat-btn { width: 30px; height: 30px; }
          .byj-mob-row { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f0ebe4; cursor: pointer; }
          .byj-mob-row:active { background: #fdfaf7; }
          .byj-mob-check { width: 22px; height: 22px; border-radius: 50%; background: #4e8a56; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .byj-mob-check.pending { background: transparent; color: #e0d0ba; border: 1.5px solid #e0d0ba; }
          .byj-mob-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #5a413f; letter-spacing: 0.12em; margin-bottom: 4px; }
          .byj-mob-val { font-size: 14px; font-weight: 700; color: #1c1810; }
          .byj-mob-confirm-bar { display: flex; align-items: center; gap: 20px; padding: 20px 20px calc(20px + env(safe-area-inset-bottom)); border-top: 1px solid #f0ebe4; background: #fff; position: sticky; bottom: 0; z-index: 100; box-shadow: 0 -10px 30px rgba(0,0,0,0.03); }
          .byj-right-drawer { width: 100%; border-left: none; border-radius: 24px 24px 0 0; top: 10vh; top: 10dvh; height: 90vh; height: 90dvh; transform: translateY(100%); }
          .byj-right-drawer.open { transform: translateY(0); }
          .byj-drawer-footer { padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
        }
      `}</style>

      <div className="build-your-jewelry-wrapper">
        <div className="byj-layout">
          <div className={`byj-canvas-area ${!selectedStyle ? 'has-bg' : ''}`}>
            <div id="byj-konva-container" ref={containerRef} style={containerStyle}></div>
            {(selectedStyle || selectedCharms.length > 0) && (
              <div className="byj-canvas-controls">
                <div className="byj-zoom-bar">
                  <button className="byj-ctrl-btn" onClick={() => handleZoom(0.8)} aria-label="Zoom out">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  <input 
                    type="range" 
                    className="byj-zoom-slider" 
                    min="0.5" 
                    max="2.5" 
                    step="0.01" 
                    value={zoom} 
                    onChange={handleSliderChange}
                    onInput={handleSliderChange}
                  />
                  <button className="byj-ctrl-btn" onClick={() => handleZoom(1.2)} aria-label="Zoom in">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
                <div className="byj-help-btn-wrap">
                  <div className={`byj-help-tooltip ${showHelpTooltip ? 'show' : ''}`}>
                    DRAG CHARMS TO REORDER<br/>TAP CHARMS TO REMOVE
                  </div>
                  <button 
                    className="byj-help-btn" 
                    aria-label="Help"
                    onMouseEnter={() => setShowHelpTooltip(true)}
                    onMouseLeave={() => setShowHelpTooltip(false)}
                    onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                  >
                    ?
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isMobile && (
            <div className="byj-config-panel">
              <div className="byj-panel-scroll">
                <div className="byj-material-bar">
                  <span className="byj-material-label">Material:</span>
                  <div className="flex gap-2">
                    {MATERIALS.map(m => (
                      <button key={m.id} className={`byj-mat-btn ${material === m.id ? 'active' : ''}`} onClick={() => setMaterial(m.id)}>
                        <span className="byj-mat-swatch" style={{ background: m.swatch }}></span>
                      </button>
                    ))}
                  </div>
                  <span className="byj-mat-name">{MATERIALS.find(m => m.id === material)?.label} Gold</span>
                </div>

                <div id="byj-desktop-steps">
                  <div className={`byj-step ${activeDesktopStep === 'length' ? 'open' : ''}`}>
                    <div className="byj-step-header" onClick={() => setActiveStep(activeDesktopStep === 'length' ? '' : 'length')}>
                      <div className="byj-step-left">
                        <span className="byj-step-check">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <div>
                          <div className="byj-step-label">Karat Selection</div>
                          <div className="byj-step-value">{length}</div>
                        </div>
                      </div>
                      <svg className="byj-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div className="byj-step-body">
                      <div className="byj-option-grid">
                        {availableLengths.map(l => (
                          <button key={l} className={`byj-opt-btn ${length === l ? 'active' : ''}`} onClick={() => setLength(l)}>{l}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`byj-step ${activeDesktopStep === 'style' ? 'open' : ''}`}>
                    <div className="byj-step-header" onClick={() => setActiveStep(activeDesktopStep === 'style' ? '' : 'style')}>
                      <div className="byj-step-left">
                        <span className={`byj-step-check ${!selectedStyle ? 'pending' : ''}`}>
                          {!selectedStyle ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </span>
                        <div>
                          <div className="byj-step-label">Base Style</div>
                          <div className="byj-step-value truncate max-w-[200px]">{selectedStyle ? getActiveVersion(selectedStyle, material, length)?.fullTitle : `Choose your ${categoryConfig.label}`}</div>
                        </div>
                      </div>
                      <svg className="byj-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
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
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              </div>
                              <div className="byj-style-info">
                                <span className="byj-style-name">{version.fullTitle}</span>
                                <span className="byj-style-price">{formatPrice(version.price)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className={`byj-step ${activeDesktopStep === 'charms' ? 'open' : ''}`}>
                    <div className="byj-step-header" onClick={() => setActiveStep(activeDesktopStep === 'charms' ? '' : 'charms')}>
                      <div className="byj-step-left">
                        <span className={`byj-step-check ${selectedCharms.length === 0 ? 'pending' : ''}`}>
                          {selectedCharms.length === 0 ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </span>
                        <div>
                          <div className="byj-step-label">Personalize with Charms</div>
                          <div className="byj-step-value">{selectedCharms.reduce((acc, c) => acc + c.qty, 0)} Selected</div>
                        </div>
                      </div>
                      <svg className="byj-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div className="byj-step-body">
                      <div className="byj-collection-circles">
                        {charmCollectionsInfo.map((col) => (
                          <div 
                            key={col.handle} 
                            className={cn("byj-collection-circle-item", activeCharmCollection === col.handle && "active")}
                            onClick={() => setActiveCharmCollection(col.handle)}
                          >
                            <div className="byj-collection-circle-img-wrap">
                              <img src={col.img} alt={col.title} />
                            </div>
                            <div className="byj-collection-circle-title">{col.title}</div>
                          </div>
                        ))}
                      </div>
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
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              </div>
                              <div className="byj-style-info">
                                <span className="byj-style-name">{version.fullTitle}</span>
                                <span className="byj-style-price">{formatPrice(version.price)}</span>
                                <div className="byj-charm-qty-wrap" onClick={(e) => e.stopPropagation()}>
                                  <button className="byj-qty-btn minus" onClick={() => updateCharmQty(group.base, -1)} aria-label="Decrease quantity">−</button>
                                  <span className="byj-qty-num">{qty}</span>
                                  <button className="byj-qty-btn plus" onClick={() => updateCharmQty(group.base, 1)} aria-label="Increase quantity">+</button>
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
                  <span className="byj-total-label">Total Estimate</span>
                  <span className="byj-total-price">{formatPrice(totalPrice)}</span>
                </div>
                <Button 
                  className="byj-confirm-btn" 
                  disabled={!isReady} 
                  onClick={handleConfirm}
                >
                  Review Summary
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Button>
              </div>
            </div>
          )}

          {isMobile && (
            <div className="byj-mobile-steps">
              <div className="byj-mobile-mat-row">
                <div>
                  <div className="byj-mob-label">Material</div>
                  <div className="byj-mob-val">{MATERIALS.find(m => m.id === material)?.label} Gold</div>
                </div>
                <div className="byj-mob-swatches">
                  {MATERIALS.map(m => (
                    <button key={m.id} className={`byj-mat-btn ${material === m.id ? 'active' : ''}`} onClick={() => setMaterial(m.id)}>
                      <span className="byj-mat-swatch" style={{ background: m.swatch }}></span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="byj-mob-row" onClick={() => openDrawer('length')}>
                <div className="flex items-center gap-4">
                  <span className="byj-mob-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></span>
                  <div>
                    <div className="byj-mob-label">Karat</div>
                    <div className="byj-mob-val">{length}</div>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a413f" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              <div className="byj-mob-row" onClick={() => openDrawer('style')}>
                <div className="flex items-center gap-4">
                  <span className={cn("byj-mob-check", !selectedStyle && "pending")}>
                    {!selectedStyle ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                  <div>
                    <div className="byj-mob-label">Style</div>
                    <div className="byj-mob-val truncate max-w-[180px]">{selectedStyle ? getActiveVersion(selectedStyle, material, length)?.fullTitle : `Choose your ${categoryConfig.label}`}</div>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a413f" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              <div className="byj-mob-row" onClick={() => openDrawer('charms')}>
                <div className="flex items-center gap-4">
                  <span className={cn("byj-mob-check", selectedCharms.length === 0 && "pending")}>
                    {selectedCharms.length === 0 ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                  <div>
                    <div className="byj-mob-label">Charms</div>
                    <div className="byj-mob-val">{selectedCharms.reduce((acc, c) => acc + c.qty, 0)} Selected</div>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a413f" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              <div className="byj-mob-confirm-bar">
                <div className="byj-total-wrap">
                  <span className="byj-total-label">Total</span>
                  <span className="byj-total-price">{formatPrice(totalPrice)}</span>
                </div>
                <Button className="flex-1 rounded-full h-12 uppercase tracking-widest font-bold text-xs" disabled={!isReady} onClick={handleConfirm}>Review Summary</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={cn("byj-drawer-overlay", isDrawerOpen && "active")} onClick={() => setIsDrawerOpen(false)}></div>
      <div className={cn("byj-right-drawer", isDrawerOpen && "open")}>
        <div className="byj-drawer-header">
          <span className="byj-drawer-title">{currentDrawerKey.toUpperCase()} OPTIONS</span>
          <button className="byj-close-btn" onClick={() => setIsDrawerOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="byj-drawer-body">
          <div className="p-6">
            {currentDrawerKey === 'length' && (
              <div className="byj-option-grid">
                {availableLengths.map(l => (
                  <button key={l} className={cn("byj-opt-btn", length === l && "active")} onClick={() => setLength(l)}>{l}</button>
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
                    <div key={group.base} className={cn("byj-style-card", isActive && "active")} onClick={() => setSelectedStyle(group)}>
                      <div className="byj-style-img-wrap">
                        <img src={version.img} alt={version.alt} loading="lazy" />
                        <div className="byj-style-check-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                      </div>
                      <div className="byj-style-info">
                        <span className="byj-style-name">{version.fullTitle}</span>
                        <span className="byj-style-price">{formatPrice(version.price)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {currentDrawerKey === 'charms' && (
              <>
                <div className="byj-collection-circles">
                  {charmCollectionsInfo.map((col) => (
                    <div 
                      key={col.handle} 
                      className={cn("byj-collection-circle-item", activeCharmCollection === col.handle && "active")}
                      onClick={() => setActiveCharmCollection(col.handle)}
                    >
                      <div className="byj-collection-circle-img-wrap">
                        <img src={col.img} alt={col.title} />
                      </div>
                      <div className="byj-collection-circle-title">{col.title}</div>
                    </div>
                  ))}
                </div>
                <div className="byj-charm-grid">
                  {charms.map(group => {
                  const version = getActiveVersion(group, material, length);
                  if (!version) return null;
                  const charmState = selectedCharms.find(c => c.base === group.base);
                  const qty = charmState?.qty || 0;
                  return (
                    <div key={group.base} className={cn("byj-charm-item", qty > 0 && "selected")} onClick={() => toggleCharmSelection(group)}>
                      <div className="byj-style-img-wrap">
                        <img src={version.img} alt={version.alt} loading="lazy" />
                        <div className="byj-style-check-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                      </div>
                      <div className="byj-style-info">
                        <span className="byj-style-name">{version.fullTitle}</span>
                        <span className="byj-style-price">{formatPrice(version.price)}</span>
                        <div className="byj-charm-qty-wrap" onClick={(e) => e.stopPropagation()}>
                          <button className="byj-qty-btn minus" onClick={() => updateCharmQty(group.base, -1)} aria-label="Decrease quantity">−</button>
                          <span className="byj-qty-num">{qty}</span>
                          <button className="byj-qty-btn plus" onClick={() => updateCharmQty(group.base, 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="byj-drawer-footer">
          <Button className="w-full rounded-full h-12 uppercase tracking-widest font-bold text-xs" onClick={() => setIsDrawerOpen(false)}>Apply Selection</Button>
        </div>
      </div>

      <div className={cn("byj-drawer-overlay", isSummaryOpen && "active")} onClick={() => setIsSummaryOpen(false)}></div>
      <div className={cn("byj-right-drawer", isSummaryOpen && "open")}>
        <div className="byj-drawer-header">
           <span className="byj-drawer-title">ORDER SUMMARY</span>
           <button className="byj-close-btn" onClick={() => setIsSummaryOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="byj-drawer-body">
          <div className="byj-summary-scroll">
            {canvasPreview && (
              <div className="byj-summary-preview">
                <img src={canvasPreview} alt="BYJ Preview" className="w-full h-auto aspect-square object-contain" />
              </div>
            )}
            
            <div className="byj-summary-details">
              <div className="byj-summary-row">
                <span className="byj-sum-label">Style & Base</span>
                <div className="flex justify-between items-start gap-[50px]">
                  <div className="byj-sum-val">{getActiveVersion(selectedStyle, material, length)?.fullTitle} ({length})</div>
                  <div className="byj-sum-price">{formatPrice(getActiveVersion(selectedStyle, material, length)?.price)}</div>
                </div>
              </div>

              <div className="byj-summary-row">
                <span className="byj-sum-label">Personalized Charms ({selectedCharms.reduce((acc, c) => acc + c.qty, 0)})</span>
                <div className="byj-summary-charms-list space-y-4">
                  {selectedCharms.map((c, i) => (
                    <div key={`${c.base}-${i}`} className="byj-sum-charm-item">
                      <div className="byj-sum-charm-img">
                        <img src={c.img} alt={c.fullTitle} className="w-full h-full object-contain" />
                      </div>
                      <div className="byj-sum-charm-info">
                        <span className="byj-sum-charm-name">{c.fullTitle}</span>
                        <span className="byj-sum-charm-qty">Quantity: {c.qty}</span>
                      </div>
                      <div className="byj-sum-price">{formatPrice(c.price * c.qty)}</div>
                    </div>
                  ))}
                  {selectedCharms.length === 0 && <div className="text-xs text-gray-400 italic">No charms added</div>}
                </div>
              </div>

              <div className="byj-summary-row border-none">
                <span className="byj-sum-label">Specifications</span>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="block text-[9px] text-[#5a413f] font-bold uppercase mb-1">Material</span>
                    <span className="text-xs font-medium">{MATERIALS.find(m => m.id === material)?.label} Gold</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-[#5a413f] font-bold uppercase mb-1">Length/Karat</span>
                    <span className="text-xs font-medium">{length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="byj-drawer-footer">
          <div className="byj-subtotal-row">
            <span className="byj-subtotal-label">Subtotal</span>
            <span className="byj-subtotal-price">{formatPrice(totalPrice)}</span>
          </div>
          <Button 
            className="w-full rounded-full h-14 uppercase tracking-widest font-bold text-sm" 
            disabled={addingToBag}
            onClick={handleAddToBag}
          >
            {addingToBag ? 'Processing...' : 'Add to Shopping Bag'}
            {!addingToBag && <svg width="18" height="18" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.22112 5.35692C4.22112 5.35692 3.81759 0.589355 7.85288 0.589355C11.8882 0.589355 11.4846 5.35692 11.4846 5.35692M0.589355 17.2758L1.33747 4.90168C1.37058 4.35392 1.82446 3.92665 2.37322 3.92665H13.3371C13.884 3.92665 14.3369 4.34892 14.3722 4.89468C14.654 9.25047 15.1164 16.5686 15.1164 17.2758C15.1164 18.0386 14.5784 18.2294 14.3094 18.2294C10.2741 18.2294 2.04206 18.2294 1.39641 18.2294C0.750767 18.2294 0.589355 17.5937 0.589355 17.2758Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
            </svg>}
          </Button>
        </div>
      </div>
    </div>
  );
}
