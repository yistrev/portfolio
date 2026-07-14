import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* テキストノードを1文字ずつ span.char に分割する（.en などの子要素は温存） */
function splitChars(el) {
  const chars = [];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const frag = document.createDocumentFragment();
    [...node.textContent].forEach((ch) => {
      if (!ch.trim()) {
        frag.append(ch);
        return;
      }
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      frag.append(span);
      chars.push(span);
    });
    node.replaceWith(frag);
  });
  return chars;
}

// キーキャップが「rootscion↵」を自動で打鍵し続けるループ（ブランドの常時モーション）
// （キー配列: esc R O O T S / ⇧ C I O N ↵ のうち文字キー＋Enter）
function startKeyTypingLoop() {
  const keys = gsap.utils.toArray('.keycap');
  const sequence = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11]; // R O O T S C I O N ↵
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8, delay: 0.6 });
  sequence.forEach((idx, i) => {
    const el = keys[idx];
    if (!el) return;
    const t = i * 0.22;
    tl.call(() => el.classList.add('is-pressed'), null, t);
    tl.call(() => el.classList.remove('is-pressed'), null, t + 0.13);
  });

  // WCAG 2.2.2: 自動で動き続けるコンテンツはホバー中に一時停止できるようにする
  const keyboard = document.querySelector('.keyboard');
  if (keyboard) {
    keyboard.addEventListener('pointerenter', () => tl.pause());
    keyboard.addEventListener('pointerleave', () => tl.resume());
  }
}

/* SERVICE: ホバー/フォーカス/タップで液晶が起動する（開閉は機能なので reduced-motion でも動かす） */
function setupService(reduceMotion) {
  const pool = '█▓▒░<>/+*#01';
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.querySelectorAll('[data-svc]').forEach((row) => {
    const btn = row.querySelector('.svc__head');
    const title = row.querySelector('[data-glitch]');
    const original = title.textContent;
    const paths = [...row.querySelectorAll('.iso-icon path:not(.dashed)')];
    const dashed = row.querySelectorAll('.iso-icon path.dashed');
    let glitchTimer = null;
    let openedByFocus = false;

    // アイソメ線画: 開くたびに描き直せるよう線長を仕込んでおく
    if (!reduceMotion) {
      paths.forEach((p) => {
        const len = p.getTotalLength();
        p.dataset.len = len;
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
      });
      if (dashed.length) gsap.set(dashed, { opacity: 0 });
    }

    const open = () => {
      if (row.classList.contains('is-on')) return;
      // 排他制御: 開いている別の行は同時に閉じる（SPの1タップ開閉を確実に）
      document.querySelectorAll('[data-svc].is-on').forEach((other) => {
        if (other !== row) other.dispatchEvent(new CustomEvent('svc-close'));
      });
      row.classList.add('is-on');
      btn.setAttribute('aria-expanded', 'true');

      if (!reduceMotion) {
        // 起動ノイズ: ゆっくりめのグリッチを経て DotGothic16 の表示に落ち着く
        let frame = 0;
        clearInterval(glitchTimer);
        glitchTimer = setInterval(() => {
          frame += 1;
          if (frame > 9) {
            clearInterval(glitchTimer);
            title.textContent = original;
            return;
          }
          title.textContent = [...original]
            .map((ch) => (Math.random() < frame / 10 ? ch : pool[(Math.random() * pool.length) | 0]))
            .join('');
        }, 55);

        // アイソメ線画がストロークで描かれていく
        gsap.to(paths, {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: 'power2.inOut',
          stagger: 0.14,
          delay: 0.25,
          overwrite: 'auto',
        });
        if (dashed.length) gsap.to(dashed, { opacity: 1, duration: 0.3, delay: 1.1, overwrite: 'auto' });
      }
    };

    const close = () => {
      row.classList.remove('is-on');
      btn.setAttribute('aria-expanded', 'false');
      clearInterval(glitchTimer);
      title.textContent = original;
      if (!reduceMotion) {
        // 次に開いたときに再度描画されるようリセット
        paths.forEach((p) => {
          gsap.set(p, { strokeDashoffset: p.dataset.len, overwrite: 'auto' });
        });
        if (dashed.length) gsap.set(dashed, { opacity: 0, overwrite: 'auto' });
      }
    };

    row.addEventListener('svc-close', close);

    if (fine) {
      row.addEventListener('pointerenter', open);
      row.addEventListener('pointerleave', close);
    }

    // タップ時: focusin が open 済みなら click では閉じない（SPの「2タップ必要」問題の解消）
    row.addEventListener('focusin', () => {
      if (!row.classList.contains('is-on')) {
        open();
        openedByFocus = true;
        setTimeout(() => { openedByFocus = false; }, 500);
      }
    });
    btn.addEventListener('click', () => {
      if (openedByFocus) {
        openedByFocus = false;
        return;
      }
      row.classList.contains('is-on') ? close() : open();
    });
    row.addEventListener('focusout', (e) => {
      if (!row.contains(e.relatedTarget)) close();
    });
  });
}

export function animate() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 液晶起動はコンテンツ開閉なので、モーション設定に関わらず必ず配線する
  setupService(reduceMotion);

  if (reduceMotion) return; // 以降の空間モーションは一切走らせない

  /* ================================================================
     全ビューポート共通
     ================================================================ */

  /* ---- エントランス: コマンドをタイプ → タイトルが立ち上がる ---- */
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
    ease: 'expo.out',
    stagger: 0.12,
  }, '+=0.1');

  // キーキャップ: 落ちて据わったあと、自動打鍵ループ開始
  gsap.from('.keycap', {
    y: -20,
    opacity: 0,
    duration: 0.45,
    ease: 'power3.out',
    stagger: 0.05,
    delay: 0.5,
    clearProps: 'transform,opacity',
    onComplete: startKeyTypingLoop,
  });

  /* ---- 序文タイトル: 1文字ずつ立ち上がる（once） ---- */
  const introTitle = document.querySelector('.intro__title');
  if (introTitle) {
    const chars = [...introTitle.querySelectorAll('.u-block')].flatMap((b) => splitChars(b));
    gsap.from(chars, {
      yPercent: 110,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'expo.out',
      stagger: 0.025,
      scrollTrigger: { trigger: introTitle, start: 'top 85%', once: true },
    });
  }

  /* ---- 汎用reveal: 一度だけふわっと立ち上がる ---- */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 40,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  /* ---- 序文の斜め線: 根が伸びるように一度だけ描画 ---- */
  gsap.utils.toArray('.diag line').forEach((line) => {
    const len = line.getTotalLength();
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    gsap.to(line, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: line.closest('.diag'), start: 'top 85%', once: true },
    });
  });

  /* ================================================================
     ScrollTrigger 演出（scrub / pin）— ステートメント文字は先に分割しておく
     ================================================================ */
  const statement = document.querySelector('[data-statement]');
  const statementLines = statement
    ? [...statement.querySelectorAll('.statement__line')].map((line) => ({
        line,
        chars: splitChars(line),
        en: line.querySelector('.en'),
      }))
    : [];

  const mm = gsap.matchMedia();

  /* ---- デスクトップ: pin + scrub をフルに使う ---- */
  mm.add('(min-width: 48rem)', () => {
    // ヒーロータイトル: 行ごとに違う速度で流れるパララックス
    const heroScrub = {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    };
    gsap.to('[data-hero-title] .line:nth-child(1)', { yPercent: -35, ease: 'none', scrollTrigger: heroScrub });
    gsap.to('[data-hero-title] .line:nth-child(2)', { yPercent: -70, ease: 'none', scrollTrigger: { ...heroScrub } });

    // ステートメント: ピン留めして、スクロール量に応じて1文字ずつ現れる
    if (statement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: statement,
          start: 'top top',
          end: '+=180%',
          scrub: true,
          pin: true,
        },
      });
      statementLines.forEach(({ chars, en }) => {
        tl.from(chars, {
          yPercent: 120,
          autoAlpha: 0,
          stagger: 0.08,
          duration: 1,
          ease: 'none',
        });
        if (en) tl.from(en, { autoAlpha: 0, x: -16, duration: 0.5, ease: 'none' }, '<0.5');
      });
      tl.from(statement.querySelector('.statement__sub'), { autoAlpha: 0, y: 24, duration: 0.8, ease: 'none' });
    }

    // 仕様表: 行がスクロール量に合わせて左から揃う
    gsap.utils.toArray('.spec-sheet tr').forEach((row) => {
      gsap.from(row, {
        x: -56,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: row, start: 'top 94%', end: 'top 62%', scrub: true },
      });
    });

    // Contact: 巨大タイトルがスクロールでせり上がる
    gsap.from('.contact__title', {
      y: 80,
      scale: 0.96,
      autoAlpha: 0.2,
      transformOrigin: 'left bottom',
      ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top 90%', end: 'top 40%', scrub: true },
    });

    // レティクル: 方眼紙の上をページ全体のスクロールに追従（displayがnoneなら何もしない）
    const tracker = document.querySelector('.tracker');
    if (tracker && getComputedStyle(tracker).display !== 'none') {
      gsap.to(tracker, {
        keyframes: [
          { x: '-32vw', y: '26vh' },
          { x: '4vw', y: '52vh' },
          { x: '-38vw', y: '18vh' },
          { x: '-10vw', y: '44vh' },
        ],
        ease: 'none',
        scrollTrigger: {
          trigger: 'main',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
        },
      });
    }
  });

  /* ---- モバイル: pin/scrubは使わず、一回きりのrevealに置き換える ---- */
  mm.add('(max-width: 47.99rem)', () => {
    statementLines.forEach(({ chars, en }, i) => {
      gsap.from(chars, {
        yPercent: 110,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.04,
        delay: i * 0.15,
        scrollTrigger: { trigger: statement, start: 'top 55%', once: true },
      });
      if (en) {
        gsap.from(en, {
          autoAlpha: 0,
          duration: 0.5,
          delay: i * 0.15 + 0.4,
          scrollTrigger: { trigger: statement, start: 'top 55%', once: true },
        });
      }
    });
    if (statement) {
      gsap.from(statement.querySelector('.statement__sub'), {
        autoAlpha: 0,
        y: 20,
        duration: 0.7,
        delay: 0.6,
        scrollTrigger: { trigger: statement, start: 'top 55%', once: true },
      });
    }

    gsap.from('.spec-sheet tr', {
      x: -40,
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: '.spec-sheet', start: 'top 82%', once: true },
    });

    gsap.from('.contact__title', {
      y: 48,
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.contact', start: 'top 80%', once: true },
    });
  });
}
