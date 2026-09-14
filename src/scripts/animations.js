import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// テキストノードを1文字ずつ span.char に分割する
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

// すべて once。scrub は題字の帯・表紙・ステートメントの形のパララックスだけ（48rem以上）
export function animate() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const wide = window.matchMedia('(min-width: 48rem)').matches;


  // 1. 表紙のエントランス
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });

  intro.from('.hero__eyebrow', { autoAlpha: 0, y: 12, duration: 0.5 });

  intro.from(
    '[data-hero-title] .line > span',
    { yPercent: 108, duration: 1.05, stagger: 0.09 },
    '-=0.25'
  );

  // トーテム
  const totem = document.querySelector('[data-composition] svg');
  if (totem) {
    const parts = [...totem.children].reverse();
    intro.from(
      parts,
      { scaleY: 0, transformOrigin: '50% 100%', autoAlpha: 0, duration: 0.5, stagger: 0.055 },
      '-=0.85'
    );
  }

  intro.from(
    ['.hero__jp', '.hero__foot'],
    { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.1 },
    '-=0.7'
  );


  // 2. 部屋番号のせり上がり
  gsap.utils.toArray('[data-room-num] span').forEach((num) => {
    gsap.from(num, {
      yPercent: 130,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: num, start: 'top 88%', once: true },
    });
  });

  // 3. ステートメント
  const statementLines = gsap.utils.toArray('[data-statement] .line');
  if (statementLines.length) {
    gsap.from(statementLines, {
      y: 26,
      autoAlpha: 0,
      duration: 0.8,
      ease: 'expo.out',
      stagger: 0.11,
      scrollTrigger: { trigger: '[data-statement]', start: 'top 82%', once: true },
    });
  }

  // 4. 題字の帯（スクロール連動）
  const band = document.querySelector('[data-marquee]');
  if (band && wide) {
    const track = band.querySelector('.marquee__track');
    gsap.fromTo(
      track,
      { xPercent: 0 },
      {
        xPercent: -50,
        ease: 'none',
        scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      }
    );
  }

  // 4b. ステートメントの形のパララックス
  if (wide) {
    gsap.utils.toArray('.statement .sh').forEach((sh) => {
      gsap.to(sh, {
        yPercent: Number(sh.dataset.shSpeed || 0),
        ease: 'none',
        scrollTrigger: {
          trigger: '.statement',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    });
  }

  // 5. About のパル引用
  const pull = document.querySelector('[data-pull]');
  if (pull) {
    const chars = [...pull.querySelectorAll('.u-block')].flatMap((b) =>
      splitChars(b.querySelector('.u-mark') || b)
    );
    gsap.from(chars, {
      yPercent: 60,
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.022,
      scrollTrigger: { trigger: pull, start: 'top 82%', once: true },
    });
  }

  // 6. 展示物（台座 → 幾何形 → キャプション）
  gsap.utils.toArray('[data-exhibit]').forEach((ex) => {
    const stage = ex.querySelector('.exhibit__stage');
    const shapes = ex.querySelectorAll('.exhibit__stage svg > *');
    const plate = ex.querySelector('.plate');

    const tl = gsap.timeline({
      scrollTrigger: { trigger: ex, start: 'top 82%', once: true },
      defaults: { ease: 'expo.out' },
    });

    tl.from(stage, { autoAlpha: 0, y: 26, duration: 0.6 })
      .from(
        shapes,
        {
          scale: 0.4,
          transformOrigin: '50% 100%',
          autoAlpha: 0,
          duration: 0.55,
          stagger: 0.045,
        },
        '-=0.3'
      )
      .from(plate, { autoAlpha: 0, y: 14, duration: 0.5 }, '-=0.35');
  });

  // 7. data-reveal
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 22,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // 8. 表紙のパララックス
  if (wide) {
    gsap.to('.hero__composition', {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
  }
}
