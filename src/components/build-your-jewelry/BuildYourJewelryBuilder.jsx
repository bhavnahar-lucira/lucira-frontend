'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

const CHAIN_COLLECTION_HANDLE = 'byj-chains';
const CHARM_COLLECTION_HANDLE = 'byj-faraways-charms';
const MAX_CHARMS = 7;

const CATEGORY_CONFIG = {
  bracelets: { label: 'Bracelet', plural: 'Bracelets', keywords: ['bracelet', 'bracelets'] },
  necklaces: { label: 'Necklace', plural: 'Necklaces', keywords: ['necklace', 'necklaces', 'chain'] },
  anklets: { label: 'Anklet', plural: 'Anklets', keywords: ['anklet', 'anklets'] },
};

const MATERIALS = [
  { id: '9k-gold', label: '9k Gold', swatch: 'linear-gradient(147deg, #C59922 18%, #EAD59E 48%, #C59922 84%)' },
  { id: 'silver', label: 'Silver', swatch: 'linear-gradient(143deg, #DFDFDF 30%, #F3F3F3 49%, #DFDFDF 66%)' },
  { id: 'rose-gold', label: 'Rose Gold', swatch: 'linear-gradient(154deg, #F2B5B5 10%, #F8DBDB 68%)' },
];

const LENGTHS = ['14KT', '18KT'];

const normalizeType = (value) => {
  const type = String(value || '').toLowerCase();
  if (type.includes('neck')) return 'necklaces';
  if (type.includes('anklet')) return 'anklets';
  return 'bracelets';
};

const getProductImage = (product) => {
  if (!product) return '';
  if (typeof product.image === 'string') return product.image;
  if (product.image?.url) return product.image.url;
  if (product.featuredImage) return product.featuredImage;
  if (product.featured_image) return product.featured_image;
  if (product.images?.[0]?.url) return product.images[0].url;
  if (typeof product.images?.[0] === 'string') return product.images[0];
  if (product.variants?.[0]?.image) return product.variants[0].image;
  return '';
};

const getProductPrice = (product) => {
  const raw = product?.price_breakup?.total || product?.price || product?.variants?.[0]?.price || 0;
  const numeric = Number(String(raw).replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatPrice = (value) => {
  const amount = Number(value || 0);
  return `?${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
};

const normalizeProduct = (product) => ({
  id: product.id || product.shopifyId || product.handle || product.title,
  handle: product.handle || '',
  title: product.title || 'Untitled Product',
  image: getProductImage(product),
  price: getProductPrice(product),
  productType: product.productType || product.product_type || product.type || product.category || '',
  tags: Array.isArray(product.tags) ? product.tags : [],
});

const productMatchesCategory = (product, category) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.bracelets;
  const searchable = [
    product.productType,
    product.title,
    product.handle,
    ...product.tags,
  ].join(' ').toLowerCase();

  return config.keywords.some((keyword) => searchable.includes(keyword));
};

const fetchCollection = async (handle) => {
  const data = await apiFetch(`/api/collection?handle=${handle}&limit=100&sort=best_selling`);
  return (data?.products || []).map(normalizeProduct);
};

const ProductTile = ({ product, selected, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`group text-left rounded-2xl border bg-white p-2 transition hover:border-[#5A413F] hover:shadow-sm disabled:opacity-50 ${selected ? 'border-[#5A413F] ring-1 ring-[#5A413F]' : 'border-[#E9DDD7]'}`}
  >
    <div className="relative aspect-square overflow-hidden rounded-xl bg-[#FBF5F2]">
      {product.image ? (
        <Image src={product.image} alt={product.title} fill sizes="(max-width: 1024px) 50vw, 220px" unoptimized className="object-cover transition duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-[#8C7C75]">No Image</div>
      )}
      {selected && (
        <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[#5A413F] text-xs text-white">?</span>
      )}
    </div>
    <div className="mt-3 space-y-1 px-1">
      <div className="line-clamp-2 min-h-10 text-sm font-medium leading-tight text-[#31211F]">{product.title}</div>
      <div className="text-sm font-semibold text-[#8A5B4F]">+{formatPrice(product.price)}</div>
    </div>
  </button>
);

export default function BuildYourJewelryBuilder({ initialType = 'bracelets' }) {
  const [material, setMaterial] = useState(MATERIALS[0].id);
  const [length, setLength] = useState(LENGTHS[0]);
  const [chains, setChains] = useState([]);
  const [charms, setCharms] = useState([]);
  const [selectedChainId, setSelectedChainId] = useState('');
  const [selectedCharmIds, setSelectedCharmIds] = useState([]);
  const [activeStep, setActiveStep] = useState('style');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    let ignore = false;

    async function loadBuilderProducts() {
      setLoading(true);
      setError('');
      try {
        const [chainProducts, charmProducts] = await Promise.all([
          fetchCollection(CHAIN_COLLECTION_HANDLE),
          fetchCollection(CHARM_COLLECTION_HANDLE),
        ]);

        if (!ignore) {
          setChains(chainProducts);
          setCharms(charmProducts);
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Unable to load builder products.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadBuilderProducts();
    return () => {
      ignore = true;
    };
  }, []);

  const category = normalizeType(initialType);
  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.bracelets;

  const visibleChains = useMemo(() => {
    const matched = chains.filter((product) => productMatchesCategory(product, category));
    return matched.length > 0 ? matched : chains;
  }, [chains, category]);

  const selectedChain = useMemo(() => {
    return visibleChains.find((product) => product.id === selectedChainId) || visibleChains[0] || null;
  }, [visibleChains, selectedChainId]);


  const selectedCharms = useMemo(() => {
    return selectedCharmIds
      .map((id) => charms.find((product) => product.id === id))
      .filter(Boolean);
  }, [charms, selectedCharmIds]);

  const total = (selectedChain?.price || 0) + selectedCharms.reduce((sum, charm) => sum + charm.price, 0);

  const toggleCharm = (charmId) => {
    setSelectedCharmIds((current) => {
      if (current.includes(charmId)) return current.filter((id) => id !== charmId);
      if (current.length >= MAX_CHARMS) return current;
      return [...current, charmId];
    });
  };

  return (
    <section className="min-h-screen bg-[#FBF1ED] py-6 md:py-10">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8A5B4F]">Build Your Jewelry</p>
            <h1 className="mt-2 font-abhaya text-3xl font-bold text-[#481A19] md:text-5xl">Build Your {categoryConfig.plural}</h1>
          </div>
          <div className="flex rounded-full bg-white p-1 shadow-sm">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <Link
                key={key}
                href={`/build-your-jewelry?type=${key}`}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${category === key ? 'bg-[#481A19] text-white' : 'text-[#5A413F] hover:bg-[#F7E8E2]'}`}
              >
                {config.plural}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="rounded-[28px] bg-white p-4 shadow-sm md:p-6">
            <div className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C7C75] md:hidden">
              Tap charms to add or remove
            </div>
            <div className="relative aspect-square overflow-hidden rounded-[24px] bg-[#FFFCFA]">
              {selectedChain?.image ? (
                <Image src={selectedChain.image} alt={selectedChain.title} fill sizes="(max-width: 1024px) 100vw, 900px" unoptimized className="object-contain p-8" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm uppercase tracking-widest text-[#8C7C75]">Choose a chain</div>
              )}

              {selectedCharms.length > 0 && (
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-[#E8D8D1] bg-white/90 p-3 shadow-sm backdrop-blur">
                  <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A5B4F]">Selected Charms</div>
                  <div className="flex justify-center gap-2 overflow-x-auto">
                    {selectedCharms.map((charm) => (
                      <button key={charm.id} type="button" onClick={() => toggleCharm(charm.id)} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#E8D8D1] bg-[#FBF5F2]">
                        {charm.image ? <Image src={charm.image} alt={charm.title} fill sizes="56px" unoptimized className="object-cover" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="overflow-hidden rounded-[28px] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#EFE2DC] p-4">
              <span className="text-sm font-semibold text-[#5A413F]">Material:</span>
              <div className="flex gap-2">
                {MATERIALS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMaterial(item.id)}
                    aria-label={item.label}
                    className={`grid h-8 w-8 place-items-center rounded-full border ${material === item.id ? 'border-[#5A413F]' : 'border-transparent'}`}
                  >
                    <span className="h-6 w-6 rounded-full" style={{ background: item.swatch }} />
                  </button>
                ))}
              </div>
              <span className="ml-auto text-sm font-medium text-[#5A413F]">{MATERIALS.find((item) => item.id === material)?.label}</span>
            </div>

            {error && <div className="m-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="max-h-none space-y-3 overflow-y-auto p-4 lg:max-h-[calc(100vh-220px)]">
              <div className="rounded-2xl border border-[#EFE2DC]">
                <button type="button" onClick={() => setActiveStep(activeStep === 'style' ? '' : 'style')} className="flex w-full items-center justify-between p-4 text-left">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A5B4F]">Style</div>
                    <div className="mt-1 text-sm font-medium text-[#30211F]">{selectedChain?.title || `Choose your ${categoryConfig.label}`}</div>
                  </div>
                  <span>{activeStep === 'style' ? '-' : '+'}</span>
                </button>
                {activeStep === 'style' && (
                  <div className="grid grid-cols-2 gap-3 border-t border-[#EFE2DC] p-3">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-[0.75] animate-pulse rounded-2xl bg-[#F5EAE5]" />)
                    ) : (
                      visibleChains.map((product) => (
                        <ProductTile
                          key={product.id}
                          product={product}
                          selected={selectedChain?.id === product.id}
                          onClick={() => setSelectedChainId(product.id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#EFE2DC]">
                <button type="button" onClick={() => setActiveStep(activeStep === 'length' ? '' : 'length')} className="flex w-full items-center justify-between p-4 text-left">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A5B4F]">Length</div>
                    <div className="mt-1 text-sm font-medium text-[#30211F]">{length}</div>
                  </div>
                  <span>{activeStep === 'length' ? '-' : '+'}</span>
                </button>
                {activeStep === 'length' && (
                  <div className="flex gap-3 border-t border-[#EFE2DC] p-3">
                    {LENGTHS.map((item) => (
                      <button key={item} type="button" onClick={() => setLength(item)} className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${length === item ? 'border-[#5A413F] bg-[#5A413F] text-white' : 'border-[#E9DDD7] text-[#5A413F]'}`}>
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div id="charms" className="rounded-2xl border border-[#EFE2DC]">
                <button type="button" onClick={() => setActiveStep(activeStep === 'charms' ? '' : 'charms')} className="flex w-full items-center justify-between p-4 text-left">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A5B4F]">Charms</div>
                    <div className="mt-1 text-sm font-medium text-[#30211F]">{selectedCharmIds.length}/{MAX_CHARMS} selected</div>
                  </div>
                  <span>{activeStep === 'charms' ? '-' : '+'}</span>
                </button>
                {activeStep === 'charms' && (
                  <div className="grid grid-cols-2 gap-3 border-t border-[#EFE2DC] p-3">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[0.75] animate-pulse rounded-2xl bg-[#F5EAE5]" />)
                    ) : (
                      charms.map((product) => {
                        const selected = selectedCharmIds.includes(product.id);
                        return (
                          <ProductTile
                            key={product.id}
                            product={product}
                            selected={selected}
                            disabled={!selected && selectedCharmIds.length >= MAX_CHARMS}
                            onClick={() => toggleCharm(product.id)}
                          />
                        );
                      })
                    )}
                    <p className="col-span-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#8A5B4F]">Select up to {MAX_CHARMS} charms</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#EFE2DC] p-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#8A5B4F]">Total</div>
                <div className="text-2xl font-bold text-[#481A19]">{formatPrice(total)}</div>
              </div>
              <Button className="rounded-full bg-[#481A19] px-7 py-6 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-[#5a211f]">
                Confirm
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
