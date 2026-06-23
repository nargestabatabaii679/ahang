
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  MusicNotes,
  Sparkle,
  Cake,
  Diamond,
  HandsPraying,
  HeartStraight,
  Confetti,
  Heart,
  Users,
  Handshake,
  Briefcase,
  Star,
  PencilSimple,
  Drop,
  Smiley,
  MoonStars,
  TrendUp,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Stepper } from "./Stepper";
import { OptionGrid, Option } from "./OptionGrid";
import { PhotoUpload } from "./PhotoUpload";
import { VoiceInput } from "./VoiceInput";
import { GenerationView } from "@/components/generation/GenerationView";
import { ResultView } from "@/components/result/ResultView";
import { Occasion, Genre, Relationship } from "@/lib/types";

const RELATIONSHIPS: Option<Relationship>[] = [
  { value: "partner", label: "عشق / پارتنر", icon: Heart },
  { value: "family", label: "خانواده", icon: Users },
  { value: "friend", label: "دوست", icon: Handshake },
  { value: "coworker", label: "همکار", icon: Briefcase },
  { value: "special", label: "شخص خاص", icon: Star },
  { value: "other", label: "سایر…", icon: PencilSimple },
];

const OCCASIONS: Option<Occasion>[] = [
  { value: "birthday", label: "تولد", icon: Cake },
  { value: "anniversary", label: "سالگرد", icon: Diamond },
  { value: "appreciation", label: "قدردانی", icon: HandsPraying },
  { value: "apology", label: "عذرخواهی", icon: HeartStraight },
  { value: "celebration", label: "تبریک", icon: Confetti },
  { value: "none", label: "بدون مناسبت", icon: Sparkle },
];

const MOODS: Option<Genre>[] = [
  { value: "romantic", label: "عاشقانه", icon: Heart },
  { value: "emotional", label: "احساسی", icon: Drop },
  { value: "happy", label: "شاد", icon: Smiley },
  { value: "calm", label: "آرام", icon: MoonStars },
  { value: "motivational", label: "انگیزه‌بخش", icon: TrendUp },
  { value: "nostalgic", label: "نوستالژیک", icon: ClockCounterClockwise },
];

const STEP_LABELS = ["گیرنده", "حال‌وهوا", "عکس و صدا"];

type Phase = "form" | "generating" | "done";

export function CreateFlow() {
  const [phase, setPhase] = useState<Phase>("form");
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [relationshipOther, setRelationshipOther] = useState("");
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [genre, setGenre] = useState<Genre | null>(null);
  const [aboutText, setAboutText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    videoUrl?: string;
    audioUrl?: string;
    lyrics?: string;
    coverArtUrl?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canNext =
    (step === 0 &&
      recipientName.trim() &&
      relationship &&
      (relationship !== "other" || relationshipOther.trim()) &&
      occasion) ||
    (step === 1 && genre) ||
    (step === 2 && photo && voice && consent);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const submit = async () => {
    if (!photo || !voice || !occasion || !genre || !relationship) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("recipientName", recipientName.trim());
      fd.append("relationship", relationship);
      fd.append("relationshipOther", relationshipOther.trim());
      fd.append("occasion", occasion);
      fd.append("genre", genre);
      fd.append("aboutText", aboutText.trim());
      fd.append("photo", photo);
      fd.append("voice", voice);
      fd.append("consent", String(consent));
      const res = await fetch("/api/jobs", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ارسال");
      setJobId(data.id);
      setPhase("generating");
    } catch (e: any) {
      setError(e?.message || "مشکلی پیش آمد");
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setPhase("form");
    setStep(0);
    setRecipientName("");
    setRelationship(null);
    setRelationshipOther("");
    setOccasion(null);
    setGenre(null);
    setAboutText("");
    setPhoto(null);
    setVoice(null);
    setConsent(false);
    setJobId(null);
    setResult({});
    setError(null);
  };

  // ── Generation / Result phases ──────────────────────────────
  if (phase === "generating" && jobId) {
    return (
      <GenerationView
        jobId={jobId}
        recipientName={recipientName}
        onDone={(r) => {
          setResult(r);
          setPhase("done");
        }}
        onRetry={restart}
      />
    );
  }

  if (phase === "done") {
    return (
      <ResultView
        recipientName={recipientName}
        result={result}
        jobId={jobId}
        onRestart={restart}
      />
    );
  }

  // ── Form phase ──────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        <Stepper steps={STEP_LABELS} current={step} />
      </div>

      <div className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 28 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, x: dir * -10, transition: { duration: 0.16, ease: "easeIn" } }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <Header
                  title="این آهنگ برای چه کسی است؟"
                  subtitle="اینها به ما کمک می‌کنند ترانه را شخصی کنیم."
                />
                <div className="space-y-2">
                  <Label htmlFor="name">نام گیرنده</Label>
                  <Input
                    id="name"
                    placeholder="مثلاً: سارا، علی، مامان، محمد…"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-3">
                  <Label>رابطهٔ شما با او</Label>
                  <OptionGrid
                    options={RELATIONSHIPS}
                    value={relationship}
                    onChange={setRelationship}
                  />
                  <AnimatePresence>
                    {relationship === "other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <Input
                          placeholder="رابطه را بنویس… مثلاً: استاد، مربی، پزشکم، هم‌تیمی، همسایه"
                          value={relationshipOther}
                          onChange={(e) => setRelationshipOther(e.target.value)}
                          autoFocus
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-3">
                  <Label>مناسبت</Label>
                  <OptionGrid
                    options={OCCASIONS}
                    value={occasion}
                    onChange={setOccasion}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <Header
                  title="حال‌وهوای آهنگ"
                  subtitle="دوست داری این آهنگ چه حسی داشته باشد؟"
                />
                <div className="space-y-3">
                  <OptionGrid options={MOODS} value={genre} onChange={setGenre} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about">
                    دوست داری آهنگ دربارهٔ چه چیزی باشد؟{" "}
                    <span className="font-normal text-muted-foreground">
                      (اختیاری)
                    </span>
                  </Label>
                  <Textarea
                    id="about"
                    placeholder="مثلاً: ممنونم که همیشه کنارم بودی… دلم برات تنگ شده… هیچ‌وقت فراموشت نمی‌کنم…"
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-7">
                <Header
                  title="خودت را وارد این آهنگ کن"
                  subtitle="یک عکس و یک نمونه‌صدا، تا آهنگ واقعاً با چهره و صدای او باشد."
                />
                <div className="space-y-2">
                  <Label>عکس خودت</Label>
                  <p className="-mt-1 text-xs text-muted-foreground">
                    یک عکس واضح از چهره‌ات انتخاب کن.
                  </p>
                  <PhotoUpload file={photo} onChange={setPhoto} />
                </div>
                <div className="space-y-2">
                  <Label>صدای خودت</Label>
                  <p className="-mt-1 text-xs text-muted-foreground">
                    حدود ۳۰ تا ۶۰ ثانیه صحبت کردن کافی است.
                  </p>
                  <VoiceInput file={voice} onChange={setVoice} />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-white/[0.02] p-4 text-sm leading-7 text-foreground/85 transition-colors hover:border-thread/30">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-border bg-transparent accent-tape"
                  />
                  <span>
                    تأیید می‌کنم از این عکس و صدا فقط برای ساخت همین آهنگ استفاده می‌شود؛
                    یعنی یا خودم هستم، یا شخصی که در عکس و صداست به من اجازه داده ویدیویی
                    با صدا و چهرهٔ او ساخته شود.
                  </span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p
            key={error}
            className="mt-5 animate-shake rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-center text-xs text-danger"
          >
            {error}
          </p>
        )}

        {/* nav */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step === 0 ? (
            <Button asChild variant="ghost" size="default" className="h-11 px-4">
              <Link to="/">
                <ArrowRight className="h-4 w-4" />
                خانه
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="default"
              className="h-11 px-4"
              onClick={() => go(step - 1)}
            >
              <ArrowRight className="h-4 w-4" />
              قبلی
            </Button>
          )}

          {step < 2 ? (
            <Button onClick={() => go(step + 1)} disabled={!canNext}>
              ادامه
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={!canNext || submitting}>
              {submitting ? (
                <>در حال ارسال…</>
              ) : (
                <>
                  <Sparkle className="h-4 w-4" />
                  شروع ساخت آهنگ
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <MusicNotes className="h-3.5 w-3.5" />
        موسیقی، صدای کلون‌شده و ویدیو، همه در یک جا
      </p>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{subtitle}</p>
    </div>
  );
}
