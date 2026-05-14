"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  cloneQuestions,
  computeFanScore,
  FAN_RAPID_TOTAL_SECONDS,
  type FanOption,
  type FanQuestion,
} from "@/lib/fanRapidFire";

const STORAGE_FORM_ID = "dharmaFanCornerFormId";

const FAN_NAME_MAX = 80;
const FAN_EMAIL_MAX = 120;

/** Letter + letters/spaces/hyphen/apostrophe (Latin + common Indic scripts). */
const FAN_NAME_RE =
  /^[\u0041-\u005A\u0061-\u007A\u00C0-\u024F\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0B80-\u0BFF][\u0041-\u005A\u0061-\u007A\u00C0-\u024F\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0B80-\u0BFF '\-\u2019]*$/;

const FAN_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

type FanRegisterFieldErrors = Partial<Record<"firstName" | "lastName" | "email", string>>;

function validateFanRegisterFields(
  firstName: string,
  lastName: string,
  email: string,
): FanRegisterFieldErrors | null {
  const err: FanRegisterFieldErrors = {};

  if (!firstName) err.firstName = "Please enter your first name.";
  else if (firstName.length < 2) err.firstName = "Use at least 2 characters.";
  else if (firstName.length > FAN_NAME_MAX) err.firstName = `Maximum ${FAN_NAME_MAX} characters.`;
  else if (!FAN_NAME_RE.test(firstName)) err.firstName = "Use letters only; spaces, hyphen and apostrophe are allowed.";

  if (!lastName) err.lastName = "Please enter your last name.";
  else if (lastName.length < 2) err.lastName = "Use at least 2 characters.";
  else if (lastName.length > FAN_NAME_MAX) err.lastName = `Maximum ${FAN_NAME_MAX} characters.`;
  else if (!FAN_NAME_RE.test(lastName)) err.lastName = "Use letters only; spaces, hyphen and apostrophe are allowed.";

  if (!email) err.email = "Please enter your email.";
  else if (email.length > FAN_EMAIL_MAX) err.email = `Maximum ${FAN_EMAIL_MAX} characters.`;
  else if (!FAN_EMAIL_RE.test(email)) err.email = "Enter a valid email address.";

  return Object.keys(err).length ? err : null;
}

/** Strapi unique / duplicate wording from proxy */
function apiErrorLooksDuplicate(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("unique") ||
    m.includes("duplicate") ||
    m.includes("already exist") ||
    m.includes("already registered") ||
    m.includes("e11000")
  );
}

type Phase = "intro" | "quiz" | "score";

function drawTimerArc(canvas: HTMLCanvasElement | null, remaining: number, total: number) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const percentage = total > 0 ? remaining / total : 0;
  const radians = percentage * 360 * (Math.PI / 180);
  ctx.clearRect(0, 0, 80, 80);
  ctx.strokeStyle = "#f37021";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(38, 37, 35, 0, radians, false);
  ctx.stroke();
}

export function FanCornerQuiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FanRegisterFieldErrors>({});
  const [formBusy, setFormBusy] = useState(false);
  const [questions, setQuestions] = useState<FanQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [timer, setTimer] = useState(FAN_RAPID_TOTAL_SECONDS);
  const [score, setScore] = useState(0);
  const [shareUrl, setShareUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const questionsRef = useRef<FanQuestion[]>([]);
  questionsRef.current = questions;
  const finalizingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!showModal) return;
    setFormError("");
    setFieldErrors({});
  }, [showModal]);

  useEffect(() => {
    drawTimerArc(canvasRef.current, timer, FAN_RAPID_TOTAL_SECONDS);
  }, [timer, phase]);

  const finalizeQuiz = useCallback(async (finalQs: FanQuestion[]) => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    const s = computeFanScore(finalQs);
    setScore(s);
    setPhase("score");
    const formId =
      typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_FORM_ID) ?? "" : "";
    if (formId) {
      try {
        await fetch("/api/forms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: formId, score: String(s) }),
        });
      } catch {
        /* noop */
      }
    }
    finalizingRef.current = false;
  }, []);

  useEffect(() => {
    if (phase !== "quiz") return undefined;
    const tick = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick);
          void finalizeQuiz(questionsRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [phase, finalizeQuiz]);

  const current = questions[qIdx];
  const hasSelection = current?.options.some((o) => o.selected) ?? false;
  const lastIndex = Math.max(0, questions.length - 1);
  const isLastQuestion = qIdx >= lastIndex && questions.length > 0;

  function selectOption(opt: FanOption) {
    if (phase !== "quiz" || !current) return;
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          options: q.options.map((o) => ({
            ...o,
            selected: o.id === opt.id,
          })),
        };
      }),
    );
  }

  function goNext() {
    if (phase !== "quiz" || !hasSelection || isLastQuestion) return;
    setQIdx((i) => i + 1);
  }

  function goSkip() {
    if (phase !== "quiz" || isLastQuestion) return;
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ?
          {
            ...q,
            options: q.options.map((o) => ({ ...o, selected: undefined })),
          }
        : q,
      ),
    );
    setQIdx((i) => i + 1);
  }

  function finishQuiz() {
    if (phase !== "quiz") return;
    void finalizeQuiz(questionsRef.current);
  }

  async function submitRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get("firstName") || "").trim();
    const lastName = String(fd.get("lastName") || "").trim();
    const email = String(fd.get("email") || "").trim();

    const localErr = validateFanRegisterFields(firstName, lastName, email);
    if (localErr) {
      setFieldErrors(localErr);
      return;
    }

    const emailNorm = email.toLowerCase();
    setFormBusy(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email: emailNorm }),
      });
      const json = (await res.json()) as { ok?: boolean; _id?: string; error?: string };
      const id = typeof json._id === "string" ? json._id : "";
      if (!json.ok || !id) {
        const apiMsg = typeof json.error === "string" ? json.error : "";
        if (apiMsg && apiErrorLooksDuplicate(apiMsg)) {
          setFormError("This email is already registered.");
        } else if (apiMsg) {
          setFormError(apiMsg);
        } else {
          setFormError("Could not register. Try again.");
        }
        setFormBusy(false);
        return;
      }
      sessionStorage.setItem(STORAGE_FORM_ID, id);
      setShowModal(false);
      setQuestions(cloneQuestions());
      setQIdx(0);
      setTimer(FAN_RAPID_TOTAL_SECONDS);
      setPhase("quiz");
    } catch {
      setFormError("Could not register. Try again.");
    }
    setFormBusy(false);
  }

  function playAgain() {
    sessionStorage.removeItem(STORAGE_FORM_ID);
    setPhase("intro");
    setQuestions([]);
    setScore(0);
    setTimer(FAN_RAPID_TOTAL_SECONDS);
    setShowModal(false);
    finalizingRef.current = false;
  }

  const fbHref =
    shareUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` : "#";
  const twHref =
    shareUrl ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}` : "#";

  return (
    <>
      <section className="fan-corner-page top-bannerss">
        <div className="dharma-word m-zero pd-all">
          <div className="container">
            <div className="banner-title text-center lin-min-ht">
              <h1 className="color-white font-hammersmith fan-corner-title margin0 text-uppercase">
                Special Rapid Fire
              </h1>
            </div>

            {phase === "intro" ?
              <div className="text-center color-white pt20 fan-corner-intro-copy">
                <div className="change-sc pt40">
                  <div className="big-pl text-center mt15">
                    <button
                      type="button"
                      className="fan-big-play-btn border-0 bg-transparent p-0"
                      onClick={() => setShowModal(true)}
                    >
                      <Image
                        src="/frontend/img/big-play.png"
                        alt="Start Rapid Fire"
                        width={220}
                        height={220}
                        className="img-fluid"
                      />
                    </button>
                  </div>
                </div>
              </div>
            : null}

            {phase === "quiz" && current ?
              <div className="change-sc pt40">
                <div className="big-pl text-center">
                  <div className="fc-question-card">
                    {/* Timer — absolutely pinned to top-right of the card */}
                    <div className="ticker dh-relative">
                      {/* tp-head: small 39×25 icon above the circular canvas ring (same as legacy) */}
                      <div className="tp-head">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/frontend/img/tp-head.png" alt="" />
                        <div>
                          <canvas ref={canvasRef} width={80} height={80} className="fan-timer-canvas" />
                        </div>
                      </div>
                      {/* Number badge — wt.png bg, positioned absolute over the canvas ring */}
                      <div className="sc-bg ps-wt">
                        <span className="color-primary font-bold">{timer}</span>
                      </div>
                    </div>
                    <div className="clearfix" />

                    {!isLastQuestion ?
                      <div className="mt-sm-40">
                        <div className="next-qsn padall30">
                          <div className="qsn-big">
                            <h2 className="color-white font-bold font-karla">
                              {current.quesNo}: {current.question}
                            </h2>
                          </div>
                          <div className="ans-opt">
                            <div className="form">
                              <ul>
                                {current.options.map((s) => (
                                  <li key={s.id}>
                                    <input
                                      type="radio"
                                      id={s.id}
                                      name={`q-${current.id}`}
                                      checked={!!s.selected}
                                      onChange={() => selectOption(s)}
                                    />
                                    <label htmlFor={s.id}>{s.name}</label>
                                    <div className="check">
                                      <div className="inside" />
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="btn-n-s mt30">
                              <div className="btn-view-more mt15 display-inline-block">
                                <button
                                  type="button"
                                  disabled={!hasSelection}
                                  onClick={() => goNext()}
                                  className={`btn-1 font-hammersmith btn mobile-center fan-corner-action ${!hasSelection ? "opacity-50" : "color-primary"}`}
                                >
                                  <svg aria-hidden="true"><rect x="0" y="0" fill="none" width="100%" height="100%" /></svg>
                                  NEXT
                                </button>
                              </div>
                              <div className="btn-view-more mt15 display-inline-block">
                                <button
                                  type="button"
                                  onClick={() => goSkip()}
                                  className="btn-1 font-hammersmith btn color-primary mobile-center fan-corner-action"
                                >
                                  <svg aria-hidden="true"><rect x="0" y="0" fill="none" width="100%" height="100%" /></svg>
                                  SKIP
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    :
                      <div className="mt-sm-40">
                        <div className="next-qsn padall30">
                          <div className="qsn-big">
                            <h2 className="color-white font-bold font-karla">
                              {current.quesNo}: {current.question}
                            </h2>
                          </div>
                          <div className="ans-opt">
                            <div className="form">
                              <ul>
                                {current.options.map((s) => (
                                  <li key={s.id}>
                                    <input
                                      type="radio"
                                      id={s.id}
                                      name={`q-${current.id}`}
                                      checked={!!s.selected}
                                      onChange={() => selectOption(s)}
                                    />
                                    <label htmlFor={s.id}>{s.name}</label>
                                    <div className="check">
                                      <div className="inside" />
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="btn-n-s mt30 text-center">
                              <div className="btn-view-more mt15">
                                <button
                                  type="button"
                                  disabled={!hasSelection}
                                  onClick={() => finishQuiz()}
                                  className={`btn-1 font-hammersmith btn mobile-center fan-corner-action ${!hasSelection ? "opacity-50" : "color-primary"}`}
                                >
                                  <svg aria-hidden="true"><rect x="0" y="0" fill="none" width="100%" height="100%" /></svg>
                                  FINISH
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            : null}

            {phase === "score" ?
              <div className="change-sc pt40">
                <div className="big-pl text-center">
                  <div className="fc-question-card">
                    <div className="final-score padall0 text-center">
                      <h1 className="color-white font-bold font-karla">Your Score: {score} / 10</h1>
                      <div className="text-center">
                        <h4 className="text-center color-white">Your Dharma Fan Meter is {score * 10}%</h4>
                        <div className="btn-view-more dh-btn-min">
                          <span>
                            <button
                              type="button"
                              onClick={() => setShowShareModal(true)}
                              className="btn-in btn-1 font-hammersmith btn color-primary mobile-center text-center border-0 bg-transparent"
                            >
                              <svg aria-hidden="true"><rect x="0" y="0" fill="none" width="100%" height="100%" /></svg>
                              SHARE WITH THE WORLD
                            </button>
                          </span>
                          <span>
                            <button
                              type="button"
                              onClick={playAgain}
                              className="btn-in btn-1 font-hammersmith btn color-primary mobile-center text-center border-0 bg-transparent fan-corner-play-again"
                            >
                              <svg aria-hidden="true"><rect x="0" y="0" fill="none" width="100%" height="100%" /></svg>
                              PLAY AGAIN
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            : null}
          </div>
        </div>
      </section>

      {showModal ?
        <div
          className="fan-corner-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fan-form-title"
        >
          <div className="white-orange-bg fan-corner-modal-inner position-relative">
            <button
              type="button"
              className="closure border-0"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-center">
              <h2 id="fan-form-title" className="color-primary font-bold f-gin">
                Enter your details
              </h2>
            </div>
            <form onSubmit={submitRegister} className="plc-hld" noValidate>
              <div className="row pop-pad g-3">
                <div className="col-12">
                  <input
                    type="text"
                    placeholder="First Name"
                    name="firstName"
                    className="form-control fan-form-control"
                    maxLength={FAN_NAME_MAX}
                    autoComplete="given-name"
                    spellCheck={false}
                    aria-invalid={fieldErrors.firstName ? true : undefined}
                    aria-describedby={fieldErrors.firstName ? "fan-err-firstName" : undefined}
                    onInput={() => setFieldErrors((prev) => ({ ...prev, firstName: undefined }))}
                  />
                  {fieldErrors.firstName ?
                    <div id="fan-err-firstName" className="fan-form-error" role="alert">
                      {fieldErrors.firstName}
                    </div>
                  : null}
                </div>
                <div className="col-12">
                  <input
                    type="text"
                    placeholder="Last Name"
                    name="lastName"
                    className="form-control fan-form-control"
                    maxLength={FAN_NAME_MAX}
                    autoComplete="family-name"
                    spellCheck={false}
                    aria-invalid={fieldErrors.lastName ? true : undefined}
                    aria-describedby={fieldErrors.lastName ? "fan-err-lastName" : undefined}
                    onInput={() => setFieldErrors((prev) => ({ ...prev, lastName: undefined }))}
                  />
                  {fieldErrors.lastName ?
                    <div id="fan-err-lastName" className="fan-form-error" role="alert">
                      {fieldErrors.lastName}
                    </div>
                  : null}
                </div>
                <div className="col-12">
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    className="form-control fan-form-control"
                    maxLength={FAN_EMAIL_MAX}
                    autoComplete="email"
                    aria-invalid={fieldErrors.email ? true : undefined}
                    aria-describedby={fieldErrors.email ? "fan-err-email" : undefined}
                    onInput={() => {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      setFormError("");
                    }}
                  />
                  {fieldErrors.email ?
                    <div id="fan-err-email" className="fan-form-error" role="alert">
                      {fieldErrors.email}
                    </div>
                  : null}
                </div>
              </div>
              {formError ?
                <p className="fan-form-error text-center small mb-2" role="alert">
                  {formError}
                </p>
              : null}
              <div className="text-center pb-3">
                <button className="btn btn-primary px-5" type="submit" disabled={formBusy}>
                  {formBusy ? "Please wait..." : "SUBMIT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      : null}

      {showShareModal ?
        <div
          className="fan-corner-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}
        >
          <div className="white-orange-bg fan-corner-modal-inner position-relative text-center">
            <button
              type="button"
              className="closure border-0"
              onClick={() => setShowShareModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="h3-main">
              <h2 id="share-modal-title" className="text-up color-primary margin0 font-bold">
                SHARE YOUR SCORE WITH
              </h2>
              <div className="dh-list sh-link">
                <ul className="padding0 text-center fan-share-ul list-unstyled">
                  <li>
                    <a href={fbHref} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/frontend/img/fb-mini.png" alt="Facebook" className="fan-share-icon" />
                    </a>
                  </li>
                  <li>
                    <a href={twHref} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/frontend/img/twitter.png" alt="Twitter" className="fan-share-icon" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      : null}
    </>
  );
}
