import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp, MessageCircle, ShieldCheck, X } from "lucide-react";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

function getOfflineAssistantReply(prompt: string, lang: string): string {
    const text = prompt.toLowerCase();

    // Emergency query
    if (
        text.includes("emergency") ||
        text.includes("108") ||
        text.includes("urgent") ||
        text.includes("आपात") ||
        text.includes("तातडी")
    ) {
        if (lang === "hi") {
            return "आपातकालीन स्थिति में तुरंत 108 नंबर पर कॉल करें या नजदीकी आपातकालीन केंद्र (District Hospital/CHC) जाएँ। स्वास्थ्यसेतु रेफरल समन्वय के लिए है, आपातकालीन प्राथमिक उपचार के लिए नहीं।";
        }
        if (lang === "mr") {
            return "तातडीच्या प्रसंगी त्वरित 108 रुग्णवाहिका सेवेला संपर्क साधा किंवा जवळच्या शासकीय रुग्णालयात जा. स्वास्थ्यसेतू रेफरल समन्वय सेवा आहे, आपत्कालीन प्रथमोपचार नाही.";
        }
        return "For acute medical emergencies, call 108 immediately or visit your nearest Emergency Department. SwasthyaSetu provides referral coordination and does not handle acute emergency response.";
    }

    // Referral query
    if (
        text.includes("referral") ||
        text.includes("work") ||
        text.includes("रेफरल") ||
        text.includes("काम") ||
        text.includes("flow")
    ) {
        if (lang === "hi") {
            return "स्वास्थ्यसेतु में एक बंद लूप (Closed-Loop) रेफरल प्रक्रिया है: आशा कार्यकर्ता गाँव में मरीज की जाँच कर डिजिटल रेफरल बनाती हैं। पीएचसी/सीएचसी के डॉक्टर इसे स्वीकार कर अप्वाइंटमेंट तय करते हैं और उपचार पूरा होने तक मरीज व प्रशासन को हर चरण दिखता है।";
        }
        if (lang === "mr") {
            return "स्वास्थ्यसेतूमध्ये रेफरल प्रवास अखंड जोडलेला आहे: आशा कार्यकर्त्या प्राथमिक तपासणी करून डिजिटल रेफरल तयार करतात. रुग्णालयातील डॉक्टर रेफरल स्वीकारून वेळ निश्चित करतात आणि उपचार पूर्ण होईपर्यंत स्थिती दिसते.";
        }
        return "In SwasthyaSetu, referrals follow a closed-loop journey: the frontline health worker (ASHA/CHO) logs vitals, runs decision support, and creates a digital referral. The receiving doctor accepts it, books an appointment, and records consultations until care is completed.";
    }

    // Appointment / Bring query
    if (
        text.includes("bring") ||
        text.includes("appointment") ||
        text.includes("document") ||
        text.includes("लाना") ||
        text.includes("कागद") ||
        text.includes("आणा")
    ) {
        if (lang === "hi") {
            return "अस्पताल जाते समय अपना आधार कार्ड या सरकारी पहचान पत्र, स्वास्थ्यसेतु मरीज आईडी, पूर्व की सभी मेडिकल रिपोर्ट्स/पर्चियाँ, और वर्तमान में चल रही दवाइयाँ साथ लेकर आएँ।";
        }
        if (lang === "mr") {
            return "रुग्णालयात जाताना आधार कार्ड किंवा ओळखपत्र, स्वास्थ्यसेतू रुग्ण आयडी, जुने वैद्यकीय अहवाल आणि सध्या सुरू असणारी औषधे सोबत ठेवावीत.";
        }
        return "Please bring your Government ID (e.g. Aadhaar card), your SwasthyaSetu Patient ID (such as SS-PAT-1024), any previous lab/diagnostic reports, and current medications to your appointment.";
    }

    // Follow-up query
    if (
        text.includes("follow") ||
        text.includes("care") ||
        text.includes("फॉलो") ||
        text.includes("पाठपुरावा") ||
        text.includes("gaps")
    ) {
        if (lang === "hi") {
            return "डॉक्टर द्वारा परामर्श और उपचार दर्ज करने के बाद मरीज का डिजिटल कार्ड अपडेट हो जाता है। स्थानीय आशा कार्यकर्ता को अलर्ट मिलता है ताकि वे घर जाकर स्वास्थ्य सुधार का फॉलो-अप ले सकें।";
        }
        if (lang === "mr") {
            return "डॉक्टरांनी उपचार पूर्ण केल्यावर डिजिटल कार्डवर नोंदी अद्ययावत होतात. स्थानिक आशा सेविकेला सूचना मिळते आणि त्या प्रत्यक्ष भेट देऊन तब्येतीचा पाठपुरावा घेतात.";
        }
        return "After your consultation and diagnostics, follow-up dates and instructions appear directly in your Patient Dashboard. Your local ASHA worker also receives a care-gap reminder to verify recovery.";
    }

    // General fallback
    if (lang === "hi") {
        return "स्वास्थ्यसेतु ग्रामीण स्वास्थ्य व्यवस्था को जोड़ता है ताकि किसी भी मरीज का इलाज अधूरा न रहे। आप रेफरल, अप्वाइंटमेंट या सुविधाओं के बारे में प्रश्न पूछ सकते हैं।";
    }
    if (lang === "mr") {
        return "स्वास्थ्यसेतू ग्रामीण आरोग्य यंत्रणेतील प्रत्येक पाऊल जोडते. आपण रेफरल, भेटीची वेळ किंवा आरोग्य केंद्रांबाबत अधिक माहिती विचारू शकता.";
    }
    return "SwasthyaSetu coordinates care across village health workers, doctors, and district health authorities to ensure no referral is lost. You can ask about referral workflows, appointments, or navigating public health services.";
}

export default function ChatWidget() {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [pending, setPending] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const visibleMessages = messages.length
        ? messages
        : [{ role: "assistant" as const, content: t("chat.welcome") }];
    const suggestedQuestions = [
        t("chat.suggestion1"),
        t("chat.suggestion2"),
        t("chat.suggestion3"),
    ];
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open, pending]);

    const sendMessage = async (value = draft) => {
        const content = value.trim();
        if (!content || pending) return;

        const nextMessages = [...visibleMessages, { role: "user" as const, content }];
        setMessages(nextMessages);
        setDraft("");
        setPending(true);

        const currentLang = i18n.resolvedLanguage ?? "en";

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: currentLang,
                    messages: nextMessages
                        .slice(-10)
                        .map(({ role, content: message }) => ({ role, content: message })),
                }),
            });
            const payload = (await response.json().catch(() => ({}))) as {
                reply?: string;
                error?: string;
                errorCode?: string;
            };

            if (response.ok && payload.reply) {
                setMessages((current) => [
                    ...current,
                    { role: "assistant", content: payload.reply! },
                ]);
            } else {
                // If API key is pending or unconfigured, gracefully supply the built-in answer
                const offlineReply = getOfflineAssistantReply(content, currentLang);
                setMessages((current) => [
                    ...current,
                    { role: "assistant", content: offlineReply },
                ]);
            }
        } catch {
            // Network or server unreachable: provide the built-in offline answer
            const offlineReply = getOfflineAssistantReply(content, currentLang);
            setMessages((current) => [
                ...current,
                { role: "assistant", content: offlineReply },
            ]);
        } finally {
            setPending(false);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void sendMessage();
    };

    return (
        <div className="chat-assistant">
            {open && (
                <section
                    className="chat-panel"
                    role="dialog"
                    aria-label={t("chat.title")}
                    aria-modal="false"
                    id="swasthyasetu-chat-panel"
                >
                    <header className="chat-header">
                        <span className="chat-avatar">
                            <ShieldCheck size={20} />
                        </span>
                        <div className="chat-header-copy">
                            <strong>{t("chat.title")}</strong>
                            <span>{t("chat.subtitle")}</span>
                        </div>
                        <button
                            className="chat-close"
                            type="button"
                            aria-label={t("chat.close")}
                            onClick={() => setOpen(false)}
                        >
                            <X size={19} />
                        </button>
                    </header>

                    <div className="chat-conversation" role="log" aria-live="polite">
                        {visibleMessages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`chat-message ${message.role}`}
                            >
                                {message.content}
                            </div>
                        ))}
                        {visibleMessages.length === 1 && (
                            <div className="chat-suggestions" aria-label={t("chat.suggestionsLabel")}>
                                {suggestedQuestions.map((question) => (
                                    <button
                                        key={question}
                                        type="button"
                                        disabled={pending}
                                        onClick={() => void sendMessage(question)}
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        )}
                        {pending && (
                            <div className="chat-message assistant chat-thinking">
                                <span></span>
                                <span></span>
                                <span></span>
                                <span className="sr-only">{t("chat.thinking")}</span>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="chat-compose-area">
                        <form className="chat-compose" onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder={t("chat.placeholder")}
                                aria-label={t("chat.questionLabel")}
                                maxLength={1200}
                                disabled={pending}
                            />
                            <button
                                type="submit"
                                aria-label={t("chat.send")}
                                disabled={pending || !draft.trim()}
                            >
                                <ArrowUp size={18} />
                            </button>
                        </form>
                        <p className="chat-disclaimer">{t("chat.disclaimer")}</p>
                    </div>
                </section>
            )}

            <button
                className="chat-launcher"
                type="button"
                aria-label={t(open ? "chat.close" : "chat.open")}
                aria-expanded={open}
                aria-controls="swasthyasetu-chat-panel"
                title={t("chat.title")}
                onClick={() => setOpen((current) => !current)}
            >
                {open ? <X size={23} /> : <MessageCircle size={24} />}
            </button>
        </div>
    );
}