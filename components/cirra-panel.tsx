"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

type CirraPanelProps = {
  open: boolean;
  onClose: () => void;
};

type ExploreAction = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

type CirraResource = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  quantity: number | string | null;
  unit: string | null;
  city: string | null;
  price: number | string | null;
  negotiation_percent:
    | number
    | string
    | null;
  status: string | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  resources?: CirraResource[];
};

const STORAGE_KEY =
  "arvena-cirra-conversation";

const exploreActions: ExploreAction[] = [
  {
    id: "classify",
    title: "Classify a Material",
    description:
      "Cari tahu jenis, kategori, dan potensi pemanfaatan suatu material.",
    icon: "♻️",
  },
  {
    id: "price",
    title: "Check Resource Price",
    description:
      "Bantu memperkirakan harga resource berdasarkan kondisi, jumlah, dan data pasar.",
    icon: "₽",
  },
  {
    id: "resources",
    title: "Find Resources",
    description:
      "Cari resource yang sesuai dengan kebutuhanmu di ekosistem ARVENA.",
    icon: "🔎",
  },
  {
    id: "impact",
    title: "Calculate Impact",
    description:
      "Hitung potensi dampak lingkungan dari aktivitasmu.",
    icon: "🌱",
  },
  {
    id: "route",
    title: "Route & Emissions",
    description:
      "Hitung perjalanan, jarak, dan estimasi emisi transportasi.",
    icon: "📍",
  },
  {
    id: "city",
    title: "Explore My City",
    description:
      "Temukan insight resource dan aktivitas circular economy berdasarkan lokasi.",
    icon: "🗺️",
  },
];

export default function CirraPanel({
  open,
  onClose,
}: CirraPanelProps) {
  const router = useRouter();

  const [chatMode, setChatMode] =
    useState(false);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [message, setMessage] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [showNewChatConfirm, setShowNewChatConfirm] =
    useState(false);

  const [hydrated, setHydrated] =
    useState(false);

  // =========================================================
  // LOAD CONVERSATION DARI SESSION STORAGE
  //
  // Chat tetap ada ketika panel ditutup dan dibuka lagi.
  // Chat hilang ketika user menekan Start New Chat.
  // =========================================================

  useEffect(() => {
    if (!open || hydrated) {
      return;
    }

    try {
      const stored =
        window.sessionStorage.getItem(
          STORAGE_KEY
        );

      if (!stored) {
        setHydrated(true);
        return;
      }

      const parsed =
        JSON.parse(stored);

      if (
        !Array.isArray(parsed) ||
        parsed.length === 0
      ) {
        setHydrated(true);
        return;
      }

      const validMessages =
        parsed.filter(
          (item: unknown): item is ChatMessage => {
            if (
              typeof item !== "object" ||
              item === null
            ) {
              return false;
            }

            const messageItem =
              item as Record<
                string,
                unknown
              >;

            return (
              (messageItem.role ===
                "user" ||
                messageItem.role ===
                  "assistant") &&
              typeof messageItem.content ===
                "string"
            );
          }
        );

      if (
        validMessages.length > 0
      ) {
        setMessages(
          validMessages
        );
        setChatMode(true);
      }
    } catch (error) {
      console.error(
        "CIRRA SESSION LOAD ERROR:",
        error
      );
    } finally {
      setHydrated(true);
    }
  }, [open, hydrated]);

  // =========================================================
  // SIMPAN CONVERSATION
  // =========================================================

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      if (
        messages.length === 0
      ) {
        window.sessionStorage.removeItem(
          STORAGE_KEY
        );
        return;
      }

      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error(
        "CIRRA SESSION SAVE ERROR:",
        error
      );
    }
  }, [messages, hydrated]);

  // =========================================================
  // PANEL DITUTUP
  // Jangan hapus conversation.
  // =========================================================

  if (!open) {
    return null;
  }

  // =========================================================
  // RESET SESSION
  // =========================================================

  function clearConversation() {
    setMessages([]);
    setMessage("");
    setSending(false);
    setChatMode(false);
    setShowNewChatConfirm(
      false
    );

    try {
      window.sessionStorage.removeItem(
        STORAGE_KEY
      );
    } catch (error) {
      console.error(
        "CIRRA SESSION CLEAR ERROR:",
        error
      );
    }
  }

  // =========================================================
  // START NEW CHAT BUTTON
  // Hanya membuka confirmation modal.
  // Tidak langsung menghapus.
  // =========================================================

  function requestNewChat() {
    if (sending) {
      return;
    }

    setShowNewChatConfirm(true);
  }

  // =========================================================
  // KEEP CURRENT CHAT
  // =========================================================

  function keepChatting() {
    setShowNewChatConfirm(
      false
    );
  }

  // =========================================================
  // CLOSE PANEL
  //
  // Conversation tetap tersimpan.
  // =========================================================

  function closePanel() {
    setShowNewChatConfirm(
      false
    );
    onClose();
  }

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  async function sendMessage(
    rawText: string
  ) {
    const trimmedText =
      rawText.trim();

    if (
      !trimmedText ||
      sending
    ) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedText,
    };

    const nextMessages = [
      ...messages,
      userMessage,
    ];

    setChatMode(true);
    setMessage("");
    setMessages(nextMessages);
    setSending(true);

    try {
      const response =
        await fetch(
          "/api/cirra",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              messages:
                nextMessages,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Cirra gagal memproses pesan."
        );
      }

      const assistantMessage:
        ChatMessage = {
        role: "assistant",
        content:
          data?.message ||
          "Cirra tidak memberikan jawaban.",
        resources:
          Array.isArray(
            data?.resources
          )
            ? data.resources
            : [],
      };

      setMessages(
        (current) => [
          ...current,
          assistantMessage,
        ]
      );
    } catch (error) {
      console.error(
        "CIRRA CHAT ERROR:",
        error
      );

      setMessages(
        (current) => [
          ...current,
          {
            role: "assistant",
            content:
              error instanceof Error
                ? error.message
                : "Cirra sedang mengalami gangguan.",
          },
        ]
      );
    } finally {
      setSending(false);
    }
  }

  // =========================================================
  // EXPLORE ACTION
  // =========================================================

  function handleExploreAction(
    actionId: string
  ) {
    const prompt =
      getPrompt(actionId);

    if (!prompt) {
      return;
    }

    void sendMessage(
      prompt
    );
  }

  // =========================================================
  // PANEL HEIGHT
  //
  // Explore sengaja lebih pendek.
  // Conversation sedikit lebih tinggi karena ada history.
  // =========================================================

  const panelHeight =
    chatMode
      ? "h-[min(635px,calc(100vh-92px))]"
      : "h-[min(590px,calc(100vh-92px))]";

  return (
    <div className="pointer-events-none fixed right-3 top-[76px] z-[120] sm:right-5">

      {/* =======================================================
          PANEL
      ======================================================= */}

      <section
        className={`pointer-events-auto flex ${panelHeight} w-[min(410px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] border border-emerald-300/15 bg-[#07100d]/98 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition-[height] duration-300`}
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="shrink-0 px-4 pt-3.5 sm:px-5">

          <div className="flex items-center justify-between">

            {/* =================================================
                CIRRA BRAND
            ================================================= */}

            <div className="flex min-w-0 items-center gap-2.5">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/10 bg-white/[0.025]">
                <Image
                  src="/cirra-logo.png"
                  alt="Cirra"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover mix-blend-screen"
                />
              </div>

              <div className="min-w-0">

                <div className="flex items-center gap-1.5">

                  <p className="text-[13px] font-semibold tracking-tight text-white">
                    Cirra
                  </p>

                  <span className="rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-emerald-200/55">
                    AI
                  </span>

                </div>

                <p className="truncate text-[8px] text-white/25 sm:text-[9px]">
                  Circular Intelligence for Resources & Community
                </p>

              </div>
            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="flex items-center gap-1">

              {/* =================================================
                  NEW CHAT
                  HANYA ADA DI CONVERSATION
              ================================================= */}

              {chatMode && (
                <button
                  type="button"
                  onClick={
                    requestNewChat
                  }
                  aria-label="Start a new chat"
                  disabled={sending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-emerald-300/[0.05] hover:text-emerald-200 disabled:pointer-events-none disabled:opacity-30"
                >
                  <Image
                    src="/cirra-new-chat.svg"
                    alt="New chat"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </button>
              )}

              {/* =================================================
                  CLOSE / CHEVRON
              ================================================= */}

              <button
                type="button"
                onClick={closePanel}
                aria-label="Close Cirra"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/[0.04] hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                >
                  <path
                    d="M5 9L12 16L19 9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

            </div>
          </div>

          {/* ===================================================
              HEADER GRADIENT LINE
          =================================================== */}

          <div className="relative mt-3 h-px w-full bg-white/[0.025]">

            <div className="absolute left-[8%] right-[8%] top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/10 to-transparent" />

            <div className="absolute left-[20%] right-[20%] top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent" />

            <div className="absolute left-[35%] right-[35%] top-0 h-[2px] bg-emerald-300/20 blur-[2px]" />

          </div>
        </div>

        {/* =====================================================
            EXPLORE VIEW
        ===================================================== */}

        {!chatMode ? (
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-3.5 sm:px-5">

            {/* =================================================
                TITLE
            ================================================= */}

            <div className="shrink-0 text-center">

              <h2 className="text-[21px] font-semibold tracking-tight text-white">
                What can Cirra help with?
              </h2>

              <p className="mx-auto mt-1 max-w-[320px] text-[10px] leading-4 text-white/30">
                Resources, circular economy,
                environmental impact, and your city.
              </p>

            </div>

            {/* =================================================
                EXPLORE LABEL
            ================================================= */}

            <div className="mt-3 flex items-center gap-3">

              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300/25 to-transparent" />

              <span className="text-[9px] text-white/20">
                explore
              </span>

              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300/25 to-transparent" />

            </div>

            {/* =================================================
                SIX EXPLORE CARDS
            ================================================= */}

            <div className="mt-2 grid grid-cols-2 gap-2.5">

              {exploreActions.map(
                (action) => (
                  <button
                    key={action.id}
                    type="button"
                    disabled={sending}
                    onClick={() =>
                      handleExploreAction(
                        action.id
                      )
                    }
                    className="group flex min-h-[98px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.018] px-3 py-2.5 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:border-emerald-300/20 hover:bg-emerald-300/[0.035] hover:shadow-[0_15px_35px_rgba(52,211,153,0.07)] disabled:pointer-events-none disabled:opacity-40"
                  >

                    <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-[16px] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:border-emerald-300/15 group-hover:bg-emerald-300/[0.06]">
                      {action.icon}
                    </div>

                    <p className="mt-1.5 text-[10px] font-semibold leading-4 text-white/75 transition-colors duration-300 group-hover:text-white">
                      {action.title}
                    </p>

                    <p className="mt-0.5 line-clamp-2 max-w-[145px] text-[8px] leading-[11px] text-white/22 transition-colors duration-300 group-hover:text-white/38">
                      {action.description}
                    </p>

                  </button>
                )
              )}

            </div>

            {/* =================================================
                EXPLORE MESSAGE BAR
            ================================================= */}

            <div className="mt-auto pt-2.5">

              <div className="relative mb-2 h-px w-full bg-white/[0.025]">

                <div className="absolute left-[8%] right-[8%] top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/12 to-transparent" />

                <div className="absolute left-[20%] right-[20%] top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-300/34 to-transparent" />

              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();

                  void sendMessage(
                    message
                  );
                }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.018] px-3 py-2 transition-all duration-300 focus-within:border-emerald-300/20 focus-within:bg-emerald-300/[0.025]"
              >

                <div className="flex items-center gap-2">

                  <input
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    disabled={sending}
                    placeholder="Message Cirra..."
                    className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[11px] text-white outline-none placeholder:text-white/22 disabled:opacity-40"
                  />

                  <button
                    type="submit"
                    disabled={
                      !message.trim() ||
                      sending
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.045] text-xs text-white/35 transition hover:bg-emerald-300/10 hover:text-emerald-200 disabled:pointer-events-none disabled:opacity-20"
                  >
                    ↑
                  </button>

                </div>
              </form>

            </div>
          </div>
        ) : (
          /* =====================================================
             CONVERSATION VIEW
          ===================================================== */

          <div className="flex min-h-0 flex-1 flex-col">

            {/* =================================================
                CHAT HISTORY
            ================================================= */}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">

              <div className="space-y-4">

                {messages.map(
                  (
                    chatMessage,
                    index
                  ) => {

                    const isUser =
                      chatMessage.role ===
                      "user";

                    return (
                      <div
                        key={`${chatMessage.role}-${index}`}
                        className={
                          isUser
                            ? "flex justify-end"
                            : "flex items-start gap-2"
                        }
                      >

                        {!isUser && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-300/10 bg-white/[0.025]">
                            <Image
                              src="/cirra-logo.png"
                              alt="Cirra"
                              width={28}
                              height={28}
                              className="h-full w-full object-cover mix-blend-screen"
                            />
                          </div>
                        )}

                        <div
                          className={
                            isUser
                              ? "max-w-[78%] rounded-2xl rounded-tr-sm bg-emerald-300/[0.1] px-3 py-2.5"
                              : "max-w-[84%] rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.025] px-3 py-2.5"
                          }
                        >

                          <p
                            className={
                              isUser
                                ? "whitespace-pre-wrap text-[10px] leading-5 text-white/78"
                                : "whitespace-pre-wrap text-[10px] leading-5 text-white/62"
                            }
                          >
                            {
                              chatMessage.content
                            }
                          </p>

                          {/* RESOURCE CARDS */}

                          {!isUser &&
                            chatMessage.resources &&
                            chatMessage.resources.length >
                              0 && (
                              <div className="mt-3 space-y-2">
                                {chatMessage.resources
                                  .slice(
                                    0,
                                    3
                                  )
                                  .map(
                                    (
                                      resource
                                    ) => (
                                      <button
                                        key={
                                          resource.id
                                        }
                                        type="button"
                                        onClick={() =>
                                          router.push(
                                            `/resources/${resource.id}`
                                          )
                                        }
                                        className="group w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/20 hover:bg-emerald-300/[0.03]"
                                      >

                                        <div className="flex items-start justify-between gap-3">

                                          <div className="min-w-0 flex-1">

                                            <p className="truncate text-[10px] font-semibold text-white/78">
                                              {
                                                resource.title
                                              }
                                            </p>

                                            <div className="mt-1 flex flex-wrap gap-x-2 text-[8px] text-white/25">

                                              {resource.quantity !==
                                                null &&
                                                resource.unit && (
                                                  <span>
                                                    {formatResourceNumber(
                                                      resource.quantity
                                                    )}{" "}
                                                    {
                                                      resource.unit
                                                    }
                                                  </span>
                                                )}

                                              {resource.city && (
                                                <span>
                                                  ·{" "}
                                                  {
                                                    resource.city
                                                  }
                                                </span>
                                              )}

                                            </div>

                                            {resource.price !==
                                              null && (
                                              <p className="mt-1.5 text-[9px] font-medium text-emerald-300/75">
                                                Rp
                                                {formatResourcePrice(
                                                  resource.price
                                                )}
                                                {resource.unit
                                                  ? ` / ${resource.unit}`
                                                  : ""}
                                              </p>
                                            )}

                                          </div>

                                          <span className="shrink-0 text-[11px] text-white/20 transition duration-300 group-hover:translate-x-0.5 group-hover:text-emerald-300">
                                            →
                                          </span>

                                        </div>

                                        <p className="mt-2 text-[8px] text-white/20 transition-colors group-hover:text-emerald-300/55">
                                          Lihat resource
                                        </p>

                                      </button>
                                    )
                                  )}
                              </div>
                            )}

                        </div>

                      </div>
                    );
                  }
                )}

                {/* =================================================
                    THINKING INDICATOR
                ================================================= */}

                {sending && (
                  <div className="flex items-start gap-2">

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-300/10 bg-white/[0.025]">
                      <Image
                        src="/cirra-logo.png"
                        alt="Cirra"
                        width={28}
                        height={28}
                        className="h-full w-full object-cover mix-blend-screen"
                      />
                    </div>

                    <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">

                      <div className="flex items-center gap-1.5">

                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300/40 [animation-delay:-0.3s]" />

                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300/40 [animation-delay:-0.15s]" />

                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300/40" />

                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* =================================================
                CHAT INPUT
            ================================================= */}

            <div className="shrink-0 px-4 pb-3 pt-2 sm:px-5">

              <div className="relative mb-2 h-px w-full bg-white/[0.025]">

                <div className="absolute left-[8%] right-[8%] top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/12 to-transparent" />

                <div className="absolute left-[20%] right-[20%] top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-300/34 to-transparent" />

              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();

                  void sendMessage(
                    message
                  );
                }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.018] px-3 py-2 transition focus-within:border-emerald-300/20"
              >

                <div className="flex items-center gap-2">

                  <input
                    autoFocus
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    disabled={sending}
                    placeholder="Message Cirra..."
                    className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[11px] text-white outline-none placeholder:text-white/22 disabled:opacity-40"
                  />

                  <button
                    type="submit"
                    disabled={
                      !message.trim() ||
                      sending
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-300/[0.08] text-xs text-emerald-200 transition hover:bg-emerald-300/[0.14] disabled:pointer-events-none disabled:opacity-20"
                  >
                    ↑
                  </button>

                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================
              NEW CHAT CONFIRMATION
          ===================================================== */}

          {showNewChatConfirm && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#07100d]/45 px-5">

              <div className="w-full max-w-[320px] rounded-[22px] border border-white/[0.08] bg-[#101914] p-5 text-center shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">

               {/* =================================================
                      RESTART ICON
                  ================================================= */}

                  <div className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full border border-emerald-300/10 bg-emerald-300/[0.055]">

                    <span
                      aria-hidden="true"
                      className="flex h-full w-full items-center justify-center pb-[1px] text-[30px] leading-none font-medium text-emerald-200/80"
                    >
                      ↻
                    </span>

                  </div>

                {/* =================================================
                    TITLE
                ================================================= */}

                <h3 className="mt-4 text-[19px] font-semibold tracking-tight text-white">
                  Start a new chat?
                </h3>

                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                <p className="mx-auto mt-2 max-w-[270px] text-[10px] leading-5 text-white/35">
                  Percakapan Cirra saat ini akan
                  dihapus dan kamu akan kembali
                  ke halaman Explore.
                </p>

                {/* =================================================
                    BUTTONS
                ================================================= */}

                <div className="mt-5 grid grid-cols-2 gap-2.5">

                  {/* KEEP CHATTING */}

                  <button
                    type="button"
                    onClick={keepChatting}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-3 text-[10px] font-medium text-white/65 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
                  >
                    Keep chatting
                  </button>

                  {/* START NEW CHAT */}

                  <button
                    type="button"
                    onClick={clearConversation}
                    className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-700/80 via-emerald-800/70 to-emerald-900/80 px-3 py-3 text-[10px] font-semibold text-emerald-50 shadow-[0_8px_24px_rgba(16,185,129,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/30 hover:from-emerald-600/85 hover:via-emerald-700/80 hover:to-emerald-800/85"
                  >
                    Start new chat
                  </button>

                </div>

              </div>
            </div>
          )}

      </section>
    </div>
  );
}

function getPrompt(
  actionId: string
) {
  const prompts: Record<
    string,
    string
  > = {
    classify:
      "Cirra, bantu saya mengidentifikasi dan mengklasifikasikan material.",

    price:
      "Cirra, bantu saya memperkirakan harga resource berdasarkan kondisi, jumlah, lokasi, dan data yang tersedia di ARVENA.",

    resources:
      "Cirra, bantu saya menemukan resource yang sesuai dengan kebutuhan saya di ekosistem ARVENA.",

    impact:
      "Cirra, bantu saya menghitung potensi dampak lingkungan dari aktivitas saya.",

    route:
      "Cirra, bantu saya menghitung jarak perjalanan dan estimasi emisi berdasarkan rute dan transportasi.",

    city:
      "Cirra, bantu saya menemukan insight resource dan aktivitas circular economy berdasarkan lokasi saya.",
  };

  return prompts[actionId] ?? "";
}

function formatResourceNumber(
  value:
    | number
    | string
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 2,
    }
  ).format(number);
}

function formatResourcePrice(
  value:
    | number
    | string
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 2,
    }
  ).format(number);
}