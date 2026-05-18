"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "@/redux/features/user/userSlice";
import {
  setReferralLink,
  setReferralLoading,
  setReferralError,
} from "@/redux/features/user/userSlice";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  Copy,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Users,
  Gift,
  CheckCircle2,
  XCircle,
  Instagram,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function ReferralPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const referralLink = useSelector((state) => state.user.referralLink);
  const loadingLink = useSelector((state) => state.user.referralLoading);

  const [stats, setStats] = useState({
    total_referrals: 0,
    coins_earned: 0,
    coins_balance: 0,
    history: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user?.id && !referralLink) {
      fetchReferralLink();
    }
  }, [user, referralLink, dispatch]);

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    }
  }, [user?.id]);

  async function fetchReferralLink() {
    try {
      dispatch(setReferralLoading(true));
      const response = await fetch("/api/customer/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: user.id }),
      });
      const data = await response.json();
      if (data.referralLink) {
        dispatch(setReferralLink(data.referralLink));
      }
    } catch (error) {
      dispatch(setReferralError("Failed loading referral link"));
    } finally {
      dispatch(setReferralLoading(false));
    }
  }

  async function fetchHistory() {
    try {
      setLoadingStats(true);
      const numericId = user.id.toString().split("/").pop();
      const res = await fetch(
        `/api/customer/referral/history?customer_id=shopify-${numericId}`
      );
      const data = await res.json();
      if (data.status) {
        setStats({
          total_referrals: data.total_referrals || 0,
          coins_earned: data.coins_earned || 0,
          coins_balance: data.coins_balance || 0,
          history: data.history || [],
        });
      }
    } catch (err) {
      console.error("Referral history fetch failed:", err);
    } finally {
      setLoadingStats(false);
    }
  }

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const shareText = `Hey! Use my referral link and get ₹1000 off on your first order: ${referralLink}`;

  const shareOnWhatsApp = () => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent("Join me on Lucira and get ₹1000 off your first order!")}&url=${encodeURIComponent(referralLink)}`,
      "_blank",
      "width=600,height=800"
    );
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      "_blank",
      "width=600,height=800"
    );
  };

  const shareOnInstagram = () => {
    handleCopyLink();
    window.open("https://www.instagram.com/", "_blank", "width=600,height=800");
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Invite Friends to Lucira",
          text: shareText,
          url: referralLink,
        })
        .catch((err) => console.log("Share cancelled", err));
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="font-figtree space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="font-figtree text-xl md:text-2xl font-bold text-zinc-900 tracking-tight mb-1">
            Refer & Earn
          </h2>
          <p className="font-figtree text-sm md:text-base text-zinc-500 font-medium leading-relaxed">
            Invite your friends and earn rewards for every successful referral.
          </p>
        </div>
        <button
          onClick={shareNative}
          className="font-figtree px-6 md:px-8 py-3 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-2xl hover:opacity-90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 w-fit"
        >
          <Share2 size={16} />
          Invite Friends
        </button>
      </div>

      {/* ── They Get / You Get Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

        {/* They Get — image left, text right */}
        <div className="relative bg-[#F3E0CF] px-6 py-6 rounded-xl border border-[#F3E0CF] h-[160px] md:h-[180px] flex flex-col justify-center overflow-hidden items-end text-right">
          <img
            src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/They_Get_img_2.png?v=1751354604"
            className="absolute left-0 bottom-0 h-full w-auto object-contain pointer-events-none"
            alt="loyalty page left"
          />
          <p className="font-figtree font-normal text-sm md:text-base leading-relaxed text-[#1A1A1A] mb-0 relative z-10">
            They Get
          </p>
          <p className="font-figtree font-bold text-xl md:text-2xl leading-tight text-[#1A1A1A] mt-1 relative z-10">
            ₹1,000 Off
            <br />
            <span className="font-normal text-xs md:text-sm text-[#3a3a3a]">
              on their 1st Order
            </span>
          </p>
        </div>

        {/* You Get — image right, text left */}
        <div className="relative bg-[#F3E0CF] px-6 py-6 rounded-xl border border-[#F3E0CF] h-[160px] md:h-[180px] flex flex-col justify-center overflow-hidden items-start text-left">
          <img
            src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/7d93784d-d99f-4716-8c45-779b911938f6_2.png?v=1751352893"
            className="absolute right-0 bottom-0 h-full w-auto object-contain pointer-events-none"
            alt="image-by-right"
          />
          <p className="font-figtree font-normal text-sm md:text-base leading-relaxed text-[#1A1A1A] mb-0 relative z-10">
            You Get
          </p>
          <p className="font-figtree font-bold text-xl md:text-2xl leading-tight text-[#1A1A1A] mt-1 relative z-10">
            2,000
            <br />
            <span className="font-normal text-xs md:text-sm text-[#3a3a3a]">
              Lucira Coins
            </span>
          </p>
        </div>
      </div>

      {/* ── Share Your Link ── */}
      <div className="bg-white rounded-[2rem] md:rounded-[4px] border border-zinc-100 p-6 md:p-8 lg:p-10 shadow-sm space-y-6 md:space-y-8">
        <div className="flex items-center gap-4 border-b border-zinc-100 pb-5 md:pb-6">
          <div className="size-11 md:size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Share2 size={22} />
          </div>
          <div>
            <h3 className="font-figtree text-lg md:text-xl font-semibold text-zinc-900 tracking-tight">
              Share Your Link
            </h3>
            <p className="font-figtree text-xs md:text-sm text-zinc-400 font-normal mt-0.5 leading-relaxed">
              Your referral link is ready to share with your friends.
            </p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 md:gap-6 items-center">
          {/* Input + Copy */}
          <div className="flex-1 w-full bg-zinc-50 rounded-2xl flex flex-row items-center p-2 border border-zinc-200 gap-2">
            <input
              type="text"
              readOnly
              value={
                referralLink ||
                (loadingLink
                  ? "Generating link..."
                  : "Please log in to generate link")
              }
              className="font-figtree bg-transparent flex-1 outline-none px-3 md:px-4 py-2.5 md:py-3 text-zinc-700 font-normal truncate text-sm min-w-0"
            />
            <button
              onClick={handleCopyLink}
              disabled={!referralLink}
              className="font-figtree shrink-0 bg-white text-zinc-800 border border-zinc-200 shadow-sm px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-xs font-semibold uppercase tracking-[0.12em] hover:border-primary hover:text-primary transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Copy size={14} />
              Copy
            </button>
          </div>

          <div className="font-figtree text-zinc-400 font-semibold text-xs uppercase tracking-[0.15em]">
            OR
          </div>

          {/* Social Icons */}
          <div className="flex shrink-0 gap-2 md:gap-3 flex-wrap justify-center">
            <button
              onClick={shareOnWhatsApp}
              className="size-12 md:size-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer group"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-110 transition-transform"
              >
                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
              </svg>
            </button>
            <button
              onClick={shareOnFacebook}
              className="size-12 md:size-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
            >
              <Facebook size={22} className="group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={shareOnTwitter}
              className="size-12 md:size-14 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center hover:bg-sky-500 hover:text-white transition-colors cursor-pointer group"
            >
              <Twitter size={22} className="group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={shareOnInstagram}
              className="size-12 md:size-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors cursor-pointer group"
            >
              <Instagram size={22} className="group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={shareOnLinkedIn}
              className="size-12 md:size-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer group"
            >
              <Linkedin size={22} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Referral History ── */}
      <div className="bg-white rounded-[2rem] md:rounded-[4px] border border-zinc-100 p-6 md:p-8 lg:p-10 shadow-sm space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row gap-5 md:gap-6 justify-between items-start md:items-center">

          {/* Section title */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="size-11 md:size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Gift size={22} />
            </div>
            <div>
              <h3 className="font-figtree text-base md:text-xl font-semibold text-zinc-900 tracking-tight">
                Referral & Transactional History
              </h3>
              <p className="font-figtree text-xs md:text-sm text-zinc-400 font-normal mt-0.5 leading-relaxed">
                Track your successful referrals and earned coins.
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto">
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 md:px-6 py-3 text-center flex-1 min-w-[140px]">
              <p className="font-figtree text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-400 mb-1">
                Total Transactions
              </p>
              <p className="font-figtree text-lg md:text-xl font-bold text-zinc-900">
                {stats.total_referrals}
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 md:px-6 py-3 text-center flex-1 min-w-[100px]">
              <p className="font-figtree text-[10px] font-semibold uppercase tracking-[0.13em] text-primary mb-1">
                Coins Earned
              </p>
              <p className="font-figtree text-lg md:text-xl font-bold text-primary">
                {stats.coins_earned}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 md:px-6 py-3 text-center flex-1 min-w-[100px]">
              <p className="font-figtree text-[10px] font-semibold uppercase tracking-[0.13em] text-amber-500 mb-1">
                Coins Balance
              </p>
              <p className="font-figtree text-lg md:text-xl font-bold text-amber-600">
                {stats.coins_balance}
              </p>
            </div>
          </div>
        </div>

        {/* Table / empty / loading */}
        <div className="overflow-x-auto">
          {loadingStats ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="size-7 md:size-8 animate-spin text-primary mb-4" />
              <p className="font-figtree text-xs md:text-sm font-semibold text-zinc-400 uppercase tracking-[0.13em]">
                Loading history...
              </p>
            </div>
          ) : stats.history.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b-2 border-zinc-100">
                  {["Name", "Date", "Status", "Reward"].map((col, i) => (
                    <th
                      key={col}
                      className={`font-figtree pb-4 pt-2 px-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-400 ${i === 3 ? "text-right" : ""}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.history.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="font-figtree py-4 px-4 text-sm font-semibold text-zinc-900">
                      {row.name}
                    </td>
                    <td className="font-figtree py-4 px-4 text-sm font-normal text-zinc-500">
                      {row.date}
                    </td>
                    <td className="py-4 px-4">
                      {row.status === "Earned" ? (
                        <span className="font-figtree inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                          <CheckCircle2 size={13} /> Earned
                        </span>
                      ) : (
                        <span className="font-figtree inline-flex items-center gap-1.5 bg-red-50 text-red-500 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                          <XCircle size={13} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="font-figtree py-4 px-4 text-right text-sm font-bold text-primary">
                      +{row.reward} coins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 md:py-16 text-center bg-zinc-50 rounded-3xl border border-zinc-100 border-dashed">
              <Users className="mx-auto size-10 md:size-12 text-zinc-300 mb-4" />
              <p className="font-figtree text-zinc-500 font-semibold text-sm mb-1.5">
                No referrals yet
              </p>
              <p className="font-figtree text-xs md:text-sm text-zinc-400 font-normal max-w-sm mx-auto leading-relaxed">
                Share your referral link with friends to start earning Lucira Coins.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}