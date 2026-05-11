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
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get("firstName") || "").trim();
    const lastName = String(fd.get("lastName") || "").trim();
    const email = String(fd.get("email") || "").trim();
    if (!firstName || !lastName || !email) {
      setFormError("Please fill all fields.");
      return;
    }
    setFormBusy(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const json = (await res.json()) as { ok?: boolean; _id?: string };
      const id = typeof json._id === "string" ? json._id : "";
      if (!json.ok || !id) {
        setFormError("Could not register. Try again.");
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
            <form onSubmit={submitRegister} className="plc-hld">
              <div className="row pop-pad g-3">
                <div className="col-12">
                  <input
                    type="text"
                    placeholder="First Name"
                    name="firstName"
                    className="form-control fan-form-control"
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="col-12">
                  <input
                    type="text"
                    placeholder="Last Name"
                    name="lastName"
                    className="form-control fan-form-control"
                    required
                    autoComplete="family-name"
                  />
                </div>
                <div className="col-12">
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    className="form-control fan-form-control"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              {formError ? <p className="text-danger text-center small mb-2">{formError}</p> : null}
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
