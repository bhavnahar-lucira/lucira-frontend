"use client";

const KARATS = [24, 22, 18, 14, 9];
const WEIGHTS = [1, 5, 10, 100];

export default function PriceTable({ baseRate }) {
    const perGramRate24 = baseRate / 10;

    return (
        <section id="gold-price-breakdown-weight" className="gold-price-breakdown-weight py-8 md:py-10 bg-white border-t border-zinc-50 relative overflow-hidden">
            {/* Subtle Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f6f0ea] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f6f0ea] rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />

            <div className="container-main relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
                    {/* <div className="inline-flex items-center gap-3 mb-2">
                        <div className="h-[1px] w-8 bg-primary/30" />
                        <p className="text-primary font-figtree tracking-[0.4em] uppercase text-[10px] md:text-[11px] font-bold">Premium Pricing Guide</p>
                        <div className="h-[1px] w-8 bg-primary/30" />
                    </div> */}
                    <h2 className="text-[18px] md:text-[28px] font-medium text-zinc-900 uppercase tracking-tight font-abhaya leading-tight px-4">
                        Gold Price Breakdown By Weight
                    </h2>
                    <p className="text-zinc-400 font-figtree text-[14px] md:text-[18px] max-w-2xl mx-auto px-4">
                        Detailed pricing overview across different purities and weights, including the latest market updates.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-zinc-100 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/80 backdrop-blur-sm">
                                    <th className="p-2 md:p-4 text-[11px] md:text-[13px] font-bold text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 text-center font-figtree">Purity</th>
                                    {WEIGHTS.map(w => (
                                        <th key={w} className="p-2 md:p-4 text-[10px] md:text-[13px] font-bold text-zinc-400 uppercase tracking-[0.2em] border-b border-l border-zinc-100 text-center font-figtree whitespace-nowrap">
                                            {w >= 100 ? `${w / 100} HG` : `${w} GM`}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {KARATS.map(karat => {
                                    const karatFactor = karat / 24;
                                    return (
                                        <tr key={karat} className="hover:bg-[#FAF3EC]/40 transition-colors group">
                                            <td className="p-2 md:p-4 border-r border-zinc-100">
                                                <div className="flex items-center gap-2 md:gap-4">
                                                    <div className={`w-4 h-4 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-[12px] font-bold font-figtree shrink-0 ${karat >= 22 ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                                                        {karat}
                                                    </div>
                                                    <span className="text-[14px] md:text-[20px] font-bold text-zinc-900 font-figtree whitespace-nowrap">{karat} Karat</span>
                                                </div>
                                            </td>
                                            {WEIGHTS.map(w => {
                                                const price = perGramRate24 * w * karatFactor;
                                                return (
                                                    <td key={w} className="p-4 md:p-10 text-[14px] md:text-[22px] text-zinc-900 text-center border-l border-zinc-100 font-figtree font-medium tracking-tight group-hover:text-primary transition-colors">
                                                        <span className="text-zinc-300 mr-0.5 font-normal">₹</span>{Math.round(price).toLocaleString('en-IN')}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-12 text-center flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest font-figtree">Real-time market rates applied</p>
                    </div>
                    <p className="text-[10px] text-zinc-300 uppercase tracking-[0.2em] font-figtree max-w">
                        *Prices exclude making charges and are calculated based on today's international bullion rates*
                    </p>
                </div>
            </div>
            <style jsx>{`
        .font-abhaya { font-family: var(--font-abhaya), serif; }
        .font-figtree { font-family: var(--font-figtree), sans-serif; }
      `}</style>
        </section>

    );
}
