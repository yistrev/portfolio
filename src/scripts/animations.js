import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// キーキャップが「reproots↵」を自動で打鍵し続けるループ
// （キー配列: esc R E P / ⌘ R O O / ⇧ T S ↵ のうち文字キー＋Enter）
function startKeyTypingLoop() {
  const keys = gsap.utils.toArray('.keycap');
  const sequence = [1, 2, 3, 5, 6, 7, 9, 10, 11]; // R E P R O O T S ↵
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8, delay: 0.6 });
  sequence.forEach((idx, i) => {
    const el = keys[idx];
    if (!el) return;
    const t = i * 0.22;
    tl.call(() => el.classList.add('is-pressed'), null, t);
    tl.call(() => el.classList.remove('is-pressed'), null, t + 0.13);
  });
}

export function animate() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  /* ---- ヒーロー: コマンドをタイプ → タイトルがせり上がる ---- */
  const typing = document.querySelector('[data-typing]');
  const fullText = typing?.dataset.text ?? '';
  const intro = gsap.timeline({ delay: 0.3 });

  if (typing) {
    typing.textContent = '';
    intro.to({ n: 0 }, {
      n: fullText.length,
      duration: fullText.length * 0.05,
      ease: 'none',
      onUpdate() {
        typing.textContent = fullText.slice(0, Math.round(this.targets()[0].n));
      },
    });
  }

  intro.from('[data-hero-title] .line > span', {
    yPercent: 110,
    duration: 1.0,
    ease: 'power4.out',
    stagger: 0.12,
  }, '+=0.15');

  // キーキャップ: 落ちてきたあと、自動打鍵ループ開始
  gsap.from('.keycap', {
    y: -24,
    opacity: 0,
    duration: 0.5,
    ease: 'back.out(2)',
    stagger: 0.06,
    delay: 0.6,
    clearProps: 'transform,opacity',
    onComplete: startKeyTypingLoop,
  });

  /* ---- ヒーロー: スクロールで行ごとに違う速度で流れる（scrub） ---- */
  const heroScrub = {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  };
  gsap.to('[data-hero-title] .line:nth-child(1)', { yPercent: -40, ease: 'none', scrollTrigger: heroScrub });
  gsap.to('[data-hero-title] .line:nth-child(2)', { yPercent: -80, ease: 'none', scrollTrigger: { ...heroScrub } });

  /* ---- ステートメント: ピン留めして1行ずつ現れる（scrub） ---- */
  const statement = document.querySelector('[data-statement]');
  if (statement) {
    gsap.timeline({
      scrollTrigger: {
        trigger: statement,
        start: 'top top',
        end: '+=160%',
        scrub: true,
        pin: true,
      },
    })
      .from(statement.querySelectorAll('.statement__line'), {
        opacity: 0.07,
        y: 56,
        duration: 1,
        stagger: 0.9,
        ease: 'none',
      })
      .from(statement.querySelector('.statement__sub'), {
        opacity: 0,
        duration: 0.7,
        ease: 'none',
      });
  }

  /* ---- 汎用: .reveal はスクロールでふわっと1回表示 ---- */
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  gsap.utils.toArray('.section-label').forEach((el) => {
    gsap.from(el, {
      x: -24,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* ---- Skills: 行が左からスクロール連動でスライドイン（scrub） ---- */
  gsap.utils.toArray('.skill-row').forEach((row) => {
    gsap.from(row, {
      x: -56,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: row, start: 'top 94%', end: 'top 60%', scrub: true },
    });
  });

  /* ---- Works: カードが下からスクロール連動で立ち上がる（scrub） ---- */
  gsap.utils.toArray('.work-card').forEach((card) => {
    gsap.from(card, {
      y: 56,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: card, start: 'top 96%', end: 'top 62%', scrub: true },
    });
  });

  /* ---- Contact: 巨大タイトルがスクロールでせり上がる（scrub） ---- */
  gsap.from('.contact__title', {
    y: 80,
    scale: 0.94,
    opacity: 0.2,
    transformOrigin: 'left bottom',
    ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top 90%', end: 'top 35%', scrub: true },
  });

  /* ---- 斜めの連結線: スクロールに合わせて根のように伸びる（scrub） ---- */
  gsap.utils.toArray('.diag line').forEach((line) => {
    const len = line.getTotalLength();
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    gsap.to(line, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: line.closest('.diag'),
        start: 'top 88%',
        end: 'bottom 50%',
        scrub: true,
      },
    });
  });

  /* ---- アイソメトリックアイコン: 線が描かれていく（stroke-dashoffset） ---- */
  gsap.utils.toArray('.iso-icon').forEach((icon) => {
    const paths = [...icon.querySelectorAll('path:not(.dashed)')];
    const dashed = icon.querySelectorAll('path.dashed');
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    if (dashed.length) gsap.set(dashed, { opacity: 0 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: icon, start: 'top 85%', once: true },
    }).to(paths, {
      strokeDashoffset: 0,
      duration: 1.4,
      ease: 'power2.inOut',
      stagger: 0.18,
    });
    if (dashed.length) tl.to(dashed, { opacity: 1, duration: 0.4 }, '-=0.5');
  });

  /* ---- ターミナル: 1行ずつタイピング風表示 ---- */
  const terminalLines = gsap.utils.toArray('.terminal__body > div');
  if (terminalLines.length) {
    gsap.from(terminalLines, {
      opacity: 0,
      duration: 0.01,
      stagger: 0.45,
      scrollTrigger: { trigger: '.terminal', start: 'top 80%', once: true },
    });
  }
}
