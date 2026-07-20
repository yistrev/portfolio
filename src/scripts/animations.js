import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* テキストノードを1文字ずつ span.char に分割する（子要素は温存） */
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

/*
 * ver4.1 モーション系統（design.md参照）:
 *   1. Heroエントランス（タイピング → タイトル行の立ち上がり → チップ/3Dパネル）
 *   2. Hero 3D（hero3d.js — オートローテート＋スクロール連動回転）
 *   3. マーキー帯 — スクロール量に連動して流れる（scrub）
 *   4. Aboutパル引用の文字立ち上がり（once）／Capabilityアイソメ線画の描画（once）
 *   5. Heroタイトルの行別パララックス／Spec行のスライド／Contactせり上がり（scrub・48rem以上）
 *   6. data-reveal（once系）
 */
export function animate() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // 空間モーションは一切走らせない（CSSは最終状態のまま）

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

  intro.from('.hero__chip, .hero3d', {
    autoAlpha: 0,
    y: 24,
    duration: 0.6,
    ease: 'power3.out',
    stagger: 0.08,
    clearProps: 'transform,opacity,visibility',
  }, '-=0.5');

  /* ---- 背景テクスチャ文字: 文字ごとに違う速度の微細パララックス ---- */
  gsap.utils.toArray('.bg-letters span').forEach((letter) => {
    const speed = parseFloat(letter.dataset.speed ?? '0.4');
    gsap.to(letter, {
      yPercent: speed * 60,
      ease: 'none',
      scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 1 },
    });
  });

  /* ---- マーキー帯: スクロール量に合わせて流れる（両方向に追従） ---- */
  gsap.utils.toArray('.marquee').forEach((band) => {
    gsap.fromTo(band.querySelector('.marquee__track'),
      { xPercent: 0 },
      {
        xPercent: -28,
        ease: 'none',
        scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      }
    );
  });

  /* ---- Aboutパル引用: 1文字ずつ立ち上がる（once） ---- */
  const pull = document.querySelector('[data-pull]');
  if (pull) {
    const chars = [...pull.querySelectorAll('.u-block')].flatMap((b) => splitChars(b));
    gsap.from(chars, {
      yPercent: 110,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'expo.out',
      stagger: 0.022,
      scrollTrigger: { trigger: pull, start: 'top 82%', once: true },
    });
  }

  /* ---- 幾何学オーナメント: ストロークで描かれる（once） ---- */
  gsap.utils.toArray('[data-orn]').forEach((orn) => {
    const paths = [...orn.querySelectorAll('path')];
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: 'power2.inOut',
      stagger: 0.12,
      scrollTrigger: { trigger: orn, start: 'top 88%', once: true },
      onComplete: () => paths.forEach((p) => p.style.removeProperty('stroke-dasharray')),
    });
  });

  /* ---- Capability: 反転は一発切替（チカチカさせない）。演出は3系統 —
         ① 走査線: 反転の瞬間＋ホバー時にネオライムのラインが上→下へ1回スイープ
         ② デコード: タイトルが記号にカチャッと化けて約0.25秒で本来の文字に収束
         ③ 線画の結合: ホバーで破線が実線に繋がり、接ぎ穂パーツが本体へ吸着 ---- */
  const cap = document.querySelector('.capability');
  if (cap) {
    const cards = gsap.utils.toArray('[data-cap]');
    const pool = '%#&*$01<>/+=';

    /* ① 走査線（.is-scanning はアニメ終了時に自動で外れ、何度でも走らせられる） */
    const scan = (card) => {
      card.classList.remove('is-scanning');
      void card.offsetWidth; // reflowを挟まないと同じアニメを再実行できない
      card.classList.add('is-scanning');
    };
    cards.forEach((card) => {
      card.addEventListener('animationend', (e) => {
        if (e.animationName === 'cap-scan') card.classList.remove('is-scanning');
      });
    });

    /* ② テキストデコード */
    const decode = (el) => {
      if (!el) return;
      const original = el.dataset.original ?? (el.dataset.original = el.textContent);
      const chars = [...original];
      const total = 12; // 40ms × 12 ≒ 0.5s で収束（ゆっくりめ）
      let frame = 0;
      clearInterval(el._decodeTimer);
      el._decodeTimer = setInterval(() => {
        frame += 1;
        if (frame >= total) {
          clearInterval(el._decodeTimer);
          el.textContent = original;
          return;
        }
        el.textContent = chars
          .map((ch, i) => (i < (frame / total) * chars.length ? ch : pool[(Math.random() * pool.length) | 0]))
          .join('');
      }, 40);
    };

    /* ③ 線画の結合（破線→実線・接ぎ穂パーツのドッキング） */
    const morph = (card, on) => {
      const dashes = card.querySelectorAll('.iso-icon .dashed');
      const dock = card.querySelector('.iso-icon .dock');
      if (dashes.length) {
        gsap.to(dashes, {
          strokeDasharray: on ? '4 0.01' : '4 5',
          duration: on ? 0.45 : 0.35,
          ease: on ? 'power2.out' : 'power2.inOut',
          overwrite: 'auto',
        });
      }
      if (dock) {
        gsap.to(dock, {
          x: on ? +dock.dataset.dx || 0 : 0,
          y: on ? +dock.dataset.dy || 0 : 0,
          duration: 0.55,
          ease: on ? 'expo.out' : 'power3.inOut',
          overwrite: 'auto',
        });
      }
    };

    /* 配線: スクロールイン = 反転＋時差で走査＆デコード / ホバー = 3つとも
       発火はセクションがしっかり視界に入ってから（反転の瞬間を見せる） */
    ScrollTrigger.create({
      trigger: cap,
      start: 'top 20%',
      onEnter: () => {
        cap.classList.add('is-void');
        cards.forEach((card, i) => {
          gsap.delayedCall(0.1 + i * 0.14, () => {
            scan(card);
            decode(card.querySelector('.cap-card__title'));
          });
        });
      },
      onLeaveBack: () => cap.classList.remove('is-void'),
    });

    cards.forEach((card) => {
      const enter = () => {
        scan(card);
        decode(card.querySelector('.cap-card__title'));
        morph(card, true);
      };
      const leave = () => morph(card, false);
      card.addEventListener('pointerenter', enter);
      card.addEventListener('pointerleave', leave);
      card.addEventListener('focusin', enter);
      card.addEventListener('focusout', (e) => {
        if (!card.contains(e.relatedTarget)) leave();
      });
    });
  }

  /* ---- Capability: Bentoカードが立ち上がり、アイソメ線画が描かれる（once） ---- */
  gsap.from('[data-cap], .cap-card--geo', {
    y: 32,
    autoAlpha: 0,
    duration: 0.55,
    ease: 'power3.out',
    stagger: 0.08,
    clearProps: 'transform,opacity,visibility',
    scrollTrigger: { trigger: '.cap-list', start: 'top 82%', once: true },
  });

  gsap.utils.toArray('[data-cap]').forEach((row, i) => {
    const paths = [...row.querySelectorAll('.iso-icon path')];
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: 'power2.inOut',
      stagger: 0.1,
      delay: 0.3 + i * 0.12,
      scrollTrigger: { trigger: '.cap-list', start: 'top 82%', once: true },
      onComplete: () => paths.forEach((p) => p.style.removeProperty('stroke-dasharray')),
    });
  });

  /* ---- 汎用reveal: 一度だけ・ハードに短く ---- */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 24,
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  const mm = gsap.matchMedia();

  /* ---- デスクトップ: scrub は要所のみ（48rem未満はマーキー以外使わない） ---- */
  mm.add('(min-width: 48rem)', () => {
    // ヒーロータイトル: 行ごとに違う速度で流れるパララックス
    const heroScrub = {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    };
    gsap.to('[data-hero-title] .line:nth-child(1)', { yPercent: -30, ease: 'none', scrollTrigger: heroScrub });
    gsap.to('[data-hero-title] .line:nth-child(2)', { yPercent: -60, ease: 'none', scrollTrigger: { ...heroScrub } });

    // 仕様表: 行がスクロール量に合わせて左から揃う
    gsap.utils.toArray('.spec-sheet tr').forEach((row) => {
      gsap.from(row, {
        x: -56,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: row, start: 'top 94%', end: 'top 66%', scrub: true },
      });
    });

    // Contact: 巨大タイトルがスクロールでせり上がる
    gsap.from('.contact__title', {
      y: 80,
      autoAlpha: 0.2,
      transformOrigin: 'left bottom',
      ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top 90%', end: 'top 40%', scrub: true },
    });
  });

  /* ---- モバイル: 一回きりのrevealに置き換える ---- */
  mm.add('(max-width: 47.99rem)', () => {
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
