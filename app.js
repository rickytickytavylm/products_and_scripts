(() => {
  const scripts = window.MF_SCRIPTS || [];
  const roadmap = window.MF_ROADMAP || {};
  const cfg = window.MF_CONFIG || {};
  const app = document.getElementById("app");
  let filter = "all";
  let query = "";
  let kiraChat = [
    {
      role: "bot",
      text: "Я Кира. Помогаю вести любой кейс: маршрут, возражение, цена, оформление. Могу опереться на скрипты этой площадки и на то, что клиент уже мог услышать от меня на сайте.",
    },
  ];
  let kiraConvId = "";
  const kiraDevice = (() => {
    const key = "mf_kira_device";
    let id = "";
    try {
      id = localStorage.getItem(key) || "";
    } catch (_) {}
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || `mf-${Date.now()}`;
      try {
        localStorage.setItem(key, id);
      } catch (_) {}
    }
    return id;
  })();

  const ICONS = {
    scripts: '<svg viewBox="0 0 24 24"><path d="M7 5h10M7 10h10M7 15h6"/><rect x="4.5" y="3.5" width="15" height="17" rx="2.4"/></svg>',
    map: '<svg viewBox="0 0 24 24"><circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="12" r="2.2"/><circle cx="8" cy="18" r="2.2"/><path d="M8 8.2l8.2 3.2M16.2 13.6L9.6 16.6"/></svg>',
    kira: '<svg viewBox="0 0 24 24"><path d="M12 4l1.1 4.3L17.4 9.4l-4.3 1.1L12 14.8l-1.1-4.3L6.6 9.4l4.3-1.1z"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4.4 12 3 4.3c-.2-1 .8-1.8 1.7-1.4l15.6 7.3c1 .5 1 1.9 0 2.4L4.7 20.1c-.9.4-1.9-.4-1.7-1.4L4.4 12Zm1.7-.9h6.2c.5 0 .9.4.9.9s-.4.9-.9.9H6.1l-.9 5 12.9-6-12.9-6 .9 5.2Z"/></svg>',
  };

  let lastRouteKey = "";

  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const route = () => {
    const raw = (location.hash || "#/").replace(/^#/, "");
    const parts = raw.split("/").filter(Boolean);
    if (parts[0] === "script" && parts[1]) return { name: "script", id: parts[1] };
    if (parts[0] === "map") return { name: "map" };
    if (parts[0] === "kira") return { name: "kira" };
    return { name: "home" };
  };

  const go = (hash) => {
    if (location.hash === hash) render();
    else location.hash = hash;
  };

  const dock = (active) => `
    <nav class="dock">
      <a href="#/" class="${active === "home" ? "on" : ""}">${ICONS.scripts}<span>Материалы</span></a>
      <a href="#/map" class="${active === "map" ? "on" : ""}">${ICONS.map}<span>Карта</span></a>
      <a href="#/kira" class="${active === "kira" ? "on" : ""}">${ICONS.kira}<span>Кира</span></a>
    </nav>`;

  const brand = (extra = "") => `
    <header class="nav">
      <a class="brand" href="#/">школа доктора шурова</a>
      ${extra}
    </header>`;

  const topbar = (title) => `
    <header class="topbar">
      <button class="icon-btn" type="button" data-back aria-label="Назад">${ICONS.back}</button>
      <p class="topbar-title">${esc(title)}</p>
      <span class="topbar-spacer" aria-hidden="true"></span>
    </header>`;

  const filtered = () => {
    const q = query.trim().toLowerCase();
    return scripts.filter((s) => {
      if (filter !== "all" && s.group !== filter) return false;
      if (!q) return true;
      return [s.title, s.full, s.lead, s.presentation?.essence, ...(s.presentation?.audience || [])]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  };

  const homeHtml = () => `
    <div class="page-home">
      <section class="hero">
        <picture class="hero-pic">
          <source media="(max-width: 720px)" srcset="assets/hero-mobile.webp" type="image/webp" />
          <img src="assets/hero-desktop.webp" alt="" width="1280" height="720" fetchpriority="high" decoding="async" />
        </picture>
        ${brand(`<span class="nav-meta">для менеджеров</span>`)}
        <div class="hero-copy">
          <h1>Продукты и скрипты</h1>
          <p>Что продаём, кому подходит и как вести заявку.</p>
        </div>
      </section>
      <div class="wrap">
        <div class="toolbar">
          <input class="search" id="q" type="search" placeholder="Найти продукт" value="${esc(query)}" />
          <div class="seg">
            <button type="button" data-filter="all" class="${filter === "all" ? "on" : ""}">Все</button>
            <button type="button" data-filter="online" class="${filter === "online" ? "on" : ""}">Онлайн</button>
            <button type="button" data-filter="offline" class="${filter === "offline" ? "on" : ""}">Офлайн</button>
          </div>
        </div>
        <div class="grid">
          ${filtered()
            .map(
              (s) => `
            <button class="card" type="button" data-open="${s.id}">
              <div class="card-top"><span>${s.tag}</span><span>${s.time}</span></div>
              <h2>${esc(s.title)}</h2>
              <p>${esc(s.lead)}</p>
            </button>`
            )
            .join("")}
        </div>
      </div>
      ${dock("home")}
    </div>`;

  const quote = (text) => `
    <figure class="quote">
      <blockquote>${esc(text)}</blockquote>
      <button class="copy" type="button" data-copy="${encodeURIComponent(text)}">Скопировать реплику</button>
    </figure>`;

  const list = (items, cls = "") =>
    `<ul class="${cls}">${(items || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;

  const routes = (items) => `
    <div class="decision">
      ${(items || [])
        .map(
          (x) => `
        <div class="decision-row">
          <span>${esc(x.if)}</span>
          <i aria-hidden="true">→</i>
          <strong>${esc(x.then)}</strong>
        </div>`
        )
        .join("")}
    </div>`;

  const offers = (items) => `
    <div class="offer-list">
      ${(items || [])
        .map(
          (x) => `
        <section class="offer-row">
          <div><h3>${esc(x.name)}</h3>${x.note ? `<p>${esc(x.note)}</p>` : ""}</div>
          <div class="offer-side"><b>${esc(x.price)}</b>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">Открыть страницу</a>` : ""}</div>
        </section>`
        )
        .join("")}
    </div>`;

  const tariffDetails = (items) => {
    if (!items?.length) return "";
    return `
      <div class="tariff-details">
        <p class="tariff-details-label">Дроздово · что входит</p>
        ${items
          .map(
            (x) => `
          <section class="tariff-card tariff-${esc(x.tone)}">
            <div class="tariff-head">
              <h3>${esc(x.name)}</h3>
              <b>${esc(x.price)}</b>
            </div>
            <p class="tariff-summary">${esc(x.summary)}</p>
            ${x.includes ? list(x.includes, "check-list tariff-includes") : ""}
            <p class="tariff-for"><strong>Для кого:</strong> ${esc(x.forWhom)}</p>
            <div class="tariff-accent">
              <span>Акцент менеджера</span>
              <p>«${esc(x.accent)}»</p>
            </div>
          </section>`
          )
          .join("")}
      </div>`;
  };

  const scriptHtml = (s) => {
    if (!s) return homeHtml();
    const p = s.presentation;
    const c = s.conversation;
    const h = s.handoff;
    const values = (p.value || [])
      .map((x) => `<section class="value"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></section>`)
      .join("");
    const steps = (c.steps || [])
      .map(
        (x, i) => `
      <section class="talk-step">
        <p class="step-no">${String(i + 1).padStart(2, "0")}</p>
        <h3>${esc(x.title)}</h3>
        <p class="hint">${esc(x.note)}</p>
        ${list(x.questions)}
      </section>`
      )
      .join("");
    const objections = (c.objections || [])
      .map(
        (x) => `
      <section class="objection">
        <div class="objection-head">
          <span class="objection-badge">Возражение</span>
          <h3>«${esc(x.client)}»</h3>
        </div>
        ${
          x.logic
            ? `<div class="objection-insight">
                 <p class="insight-label">Понимание для менеджера</p>
                 <p class="insight-text">${esc(x.logic)}</p>
               </div>`
            : ""
        }
        <div class="objection-speech">
          <p class="speech-label">Готовая реплика клиенту:</p>
          ${quote(x.answer)}
        </div>
      </section>`
      )
      .join("");
    return `
    <article class="page-script">
      ${topbar(s.title)}
      <div class="read">
        <p class="kicker">${esc(s.tag)} · ${esc(s.time)}</p>
        <h1>${esc(s.full)}</h1>
        <p class="dek">${esc(s.lead)}</p>
        <p class="coach"><b>Менеджер сам ведёт продажу до решения клиента, оплаты или подтверждённого оформления.</b> Врачи, диспетчеры и администраторы подключаются только к исполнению услуги, а не забирают продажу.${
          s.id === "rc"
            ? ` <a class="coach-link" href="#/map">Дорожная карта РЦ</a>`
            : ""
        }</p>

        <nav class="article-nav" aria-label="Содержание">
          <button type="button" data-jump="product">Продукт</button>
          <button type="button" data-jump="route">Маршрут</button>
          <button type="button" data-jump="talk">Скрипт</button>
          <button type="button" data-jump="objections">Возражения</button>
          <button type="button" data-jump="handoff">Оформление</button>
        </nav>

        <section class="chapter" id="product">
          <p class="chapter-label">Часть 1 · Презентация продукта</p>
          <h2>Что продаём на самом деле</h2>
          <p class="chapter-lead">${esc(p.essence)}</p>

          <h2>Кому подходит</h2>
          ${list(p.audience, "check-list")}

          <h2>Когда нужен другой маршрут</h2>
          ${list(p.notFor, "stop-list")}

          <h2>Ценность для клиента</h2>
          <div class="values">${values}</div>

          <h2>Факты, которые нужно знать</h2>
          ${list(p.facts)}
        </section>

        <section class="chapter" id="route">
          <p class="chapter-label">Логика выбора</p>
          <h2>Если клиент говорит это</h2>
          ${routes(p.routes)}

          <h2>Форматы и цена</h2>
          ${offers(p.offers)}
          ${tariffDetails(p.tariffDetails)}

          <aside class="limits">
            <h3>Не обещать</h3>
            ${list(p.limits)}
          </aside>
        </section>

        <section class="chapter talk" id="talk">
          <p class="chapter-label">Часть 2 · Рабочий скрипт</p>
          <h2>Задача разговора</h2>
          <p class="chapter-lead">${esc(c.goal)}</p>

          <h2>Как начать</h2>
          ${quote(c.opening)}

          <h2>Что выяснить</h2>
          <p class="hint">Не задавайте всё подряд. Слушайте ответ и берите следующий вопрос только из нужного блока.</p>
          <div class="talk-steps">${steps}</div>

          <h2>Переход к предложению</h2>
          ${quote(c.bridge)}

          <h2>Короткая презентация</h2>
          ${quote(c.pitch)}

          <h2>Как назвать цену</h2>
          ${quote(c.price)}

          <h2>Следующий шаг</h2>
          ${quote(c.close)}
        </section>

        <section class="chapter" id="objections">
          <p class="chapter-label">Не спорить, а отвечать</p>
          <h2>Возражения</h2>
          <div class="objections">${objections}</div>
        </section>

        <section class="chapter" id="handoff">
          <p class="chapter-label">После согласия клиента</p>
          <h2>Как оформить и запустить услугу</h2>
          <p><b>Когда оформляем:</b> ${esc(h.when)}</p>
          <p><b>Кого подключаем к исполнению:</b> ${esc(h.where)}</p>

          <h2>Что зафиксировать</h2>
          ${list(h.payload, "check-list")}

          <h2>Что сделать менеджеру</h2>
          ${list(h.actions)}

          <h2>Дальнейшая работа</h2>
          ${list(h.followup)}
        </section>
      </div>
    </article>`;
  };

  const mapHtml = () => {
    const r = roadmap;
    const stages = r.stages || [];
    const path = stages
      .map((s) => {
        const say = (s.say || []).map((x) => quote(x)).join("");
        const qs = s.questions ? list(s.questions) : "";
        const work = s.do ? list(s.do, "check-list") : "";
        const points = s.points ? list(s.points) : "";
        const family = s.family ? `<h3>Как семья видит, что всё идёт хорошо</h3>${list(s.family)}` : "";
        const example = s.example
          ? `<div class="map-example"><p class="insight-label">Пример отражения</p><p>${esc(s.example)}</p></div>`
          : "";
        return `
        <section class="map-step" id="${esc(s.id)}">
          <p class="map-no">${esc(s.no)}</p>
          <div class="map-step-body">
            ${s.time ? `<p class="map-time">${esc(s.time)}</p>` : ""}
            <h2>${esc(s.title)}</h2>
            <p class="chapter-lead">${esc(s.goal)}</p>
            ${work}${qs}${example}${say}${points}${family}
          </div>
        </section>`;
      })
      .join("");
    const prices = (r.prices || [])
      .map(
        (x) => `
      <div class="price-row">
        <h3>${esc(x.place)}</h3>
        <p><span>Стандарт</span><b>${esc(x.standard)}</b></p>
        <p><span>Интенсив</span><b>${esc(x.intensive)}</b></p>
        <p><span>Индивидуальный</span><b>${esc(x.individual)}</b></p>
      </div>`
      )
      .join("");
    const follow = (r.followup || [])
      .map(
        (x) => `
      <div class="follow-row">
        <strong>${esc(x.when)}</strong>
        <span>${esc(x.what)}</span>
      </div>`
      )
      .join("");
    return `
    <div class="page-map">
      ${brand(`<span class="nav-meta">регламент РЦ</span>`)}
      <div class="read map-read">
        <p class="kicker">Отдельная вкладка · не лонгрид продукта</p>
        <h1>${esc(r.title)}</h1>
        <p class="dek">${esc(r.lead)}</p>
        <p class="coach">${esc(r.coach)} <a class="coach-link" href="#/script/rc">Открыть скрипт РЦ</a></p>
        <nav class="article-nav" aria-label="Этапы">
          ${stages
            .map((s) => `<button type="button" data-jump="${esc(s.id)}">${esc(s.no)}</button>`)
            .join("")}
        </nav>
        <div class="map-path">${path}</div>
        <section class="chapter" id="price-board">
          <p class="chapter-label">Корпуса</p>
          <h2>Ценник в месяц</h2>
          <div class="price-board">${prices}</div>
        </section>
        <section class="chapter" id="follow">
          <p class="chapter-label">После звонка</p>
          <h2>Регламент касаний</h2>
          <div class="follow-board">${follow}</div>
          <aside class="limits">
            <h3>Когда можно снять заявку</h3>
            <p>${esc(r.closeRule)}</p>
          </aside>
        </section>
      </div>
      ${dock("map")}
    </div>`;
  };

  const kiraHtml = () => `
    <div class="page-kira">
      ${topbar("Кира")}
      <div class="feed" id="feed">
        ${kiraChat
          .map((m) => `<div class="bubble ${m.role === "warn" ? "warn" : m.role === "me" ? "me" : "bot"}">${esc(m.text)}</div>`)
          .join("")}
      </div>
      <form class="composer" id="kiraForm">
        <div class="composer-inner">
          <textarea id="kiraIn" class="composer-input" rows="1" placeholder="Как объявить цену РЦ" enterkeyhint="send"></textarea>
          <button class="send-btn" type="submit" aria-label="Отправить">${ICONS.send}</button>
        </div>
      </form>
    </div>`;

  const localKira = (text) => {
    const t = text.toLowerCase();
    const hit =
      scripts.find((s) => t.includes(s.id) || t.includes(s.title.toLowerCase()) || t.includes(s.full.toLowerCase())) ||
      (t.includes("рц") || t.includes("реаб") ? scripts.find((s) => s.id === "rc") : null) ||
      (t.includes("стацион") || t.includes("госпитал") ? scripts.find((s) => s.id === "hospital") : null) ||
      (t.includes("детокс") || t.includes("капель") || t.includes("выезд") ? scripts.find((s) => s.id === "detox") : null) ||
      (t.includes("гпс") || t.includes("групп") ? scripts.find((s) => s.id === "gps") : null) ||
      (t.includes("вип") || t.includes("vip") ? scripts.find((s) => s.id === "vip-psy") : null) ||
      (t.includes("соз") || t.includes("любить") ? scripts.find((s) => s.id === "soza") : null) ||
      (t.includes("завис") ? scripts.find((s) => s.id === "addict") : null) ||
      (t.includes("семейн") || t.includes("психолог") || t.includes("психиатр") ? scripts.find((s) => s.id === "online") : null);

    if (t.includes("vpn") || t.includes("тайм") || t.includes("не отвечает")) {
      return "Если ответ завис, отключите VPN или прокси и отправьте вопрос ещё раз.";
    }
    if (!hit) {
      return "Уточните направление: РЦ, стационар, детокс, ГПС, индивидуальное сопровождение, помощь близким, зависимые или другой онлайн. Могу дать приветствие, вопросы, цену или порядок оформления.";
    }
    if (t.includes("цен") || t.includes("тариф") || t.includes("сколько")) {
      return hit.presentation.offers.map((x) => `${x.name}: ${x.price}`).join("\n");
    }
    if (t.includes("привет") || t.includes("начать") || t.includes("откро")) return hit.conversation.opening;
    if (t.includes("переда") || t.includes("оформ") || t.includes("лид") || t.includes("групп")) {
      return `Когда: ${hit.handoff.when}\n\nКуда: ${hit.handoff.where}`;
    }
    if (t.includes("спрос") || t.includes("сбор") || t.includes("вопрос")) {
      return hit.conversation.steps
        .flatMap((x) => x.questions)
        .map((x) => `• ${x}`)
        .join("\n");
    }
    return hit.presentation.essence;
  };

  const askKira = async (text) => {
    kiraChat.push({ role: "me", text });
    render();
    const url = (cfg.BACKEND_URL || "").replace(/\/$/, "");
    const feed = document.getElementById("feed");
    const bubble = document.createElement("div");
    bubble.className = "bubble bot";
    bubble.textContent = "Думаю…";
    if (feed) {
      feed.appendChild(bubble);
      feed.scrollTop = feed.scrollHeight;
    }

    const history = kiraChat
      .filter((m) => m.role === "me" || m.role === "bot")
      .map((m) => ({
        role: m.role === "me" ? "user" : "assistant",
        content: m.text,
      }));

    if (!url) {
      const fallback = localKira(text);
      kiraChat.push({ role: "bot", text: fallback });
      render();
      return;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.TIMEOUT_MS || 75000);
    let acc = "";
    try {
      const res = await fetch(url + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          messages: history,
          mode: "manager",
          deviceId: kiraDevice,
          conversationId: kiraConvId || undefined,
          lang: "ru",
        }),
      });
      if (!res.ok || !res.body) throw new Error("bad");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const block of parts) {
          const em = block.match(/^event:\s*(.+)$/m);
          const dm = block.match(/^data:\s*(.+)$/m);
          if (!dm) continue;
          let data;
          try {
            data = JSON.parse(dm[1]);
          } catch (_) {
            continue;
          }
          const ev = em ? em[1].trim() : "message";
          if (ev === "delta" && data.text) {
            acc += data.text;
            bubble.textContent = acc;
            if (feed) feed.scrollTop = feed.scrollHeight;
          } else if (ev === "error") {
            throw new Error(data.message || "error");
          } else if (ev === "done" && data.conversationId) {
            kiraConvId = data.conversationId;
          }
        }
      }
      clearTimeout(timer);
      if (!acc) throw new Error("empty");
      kiraChat.push({ role: "bot", text: acc });
      render();
    } catch (e) {
      clearTimeout(timer);
      const timedOut = e && (e.name === "AbortError" || /aborted|timeout/i.test(String(e.message || "")));
      const blocked = e instanceof TypeError && !acc;
      const warn = blocked
        ? "Не удалось связаться с сервером. Если включён VPN или прокси — отключите и отправьте ещё раз."
        : timedOut
          ? "Ответ не пришёл вовремя. Если включён VPN — отключите и отправьте вопрос ещё раз."
          : "Связь прервалась. Попробуйте ещё раз. Если включён VPN — его тоже стоит отключить.";
      kiraChat.push({ role: "warn", text: warn });
      kiraChat.push({ role: "bot", text: localKira(text) });
      render();
    }
  };

  const bind = () => {
    document.querySelectorAll("[data-open]").forEach((el) => {
      el.onclick = () => go("#/script/" + el.getAttribute("data-open"));
    });
    document.querySelectorAll("[data-back]").forEach((el) => {
      el.onclick = () => history.length > 1 ? history.back() : go("#/");
    });
    document.querySelectorAll("[data-jump]").forEach((el) => {
      el.onclick = () => {
        const target = document.getElementById(el.getAttribute("data-jump"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    document.querySelectorAll("[data-filter]").forEach((el) => {
      el.onclick = () => {
        filter = el.getAttribute("data-filter");
        render();
      };
    });
    const q = document.getElementById("q");
    if (q) {
      q.oninput = () => {
        query = q.value;
        const start = q.selectionStart;
        render();
        const again = document.getElementById("q");
        if (again) {
          again.focus();
          again.setSelectionRange(start, start);
        }
      };
    }
    document.querySelectorAll("[data-copy]").forEach((el) => {
      el.onclick = async () => {
        const text = decodeURIComponent(el.getAttribute("data-copy") || "");
        try {
          await navigator.clipboard.writeText(text);
        } catch (_) {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        el.textContent = "Скопировано";
        el.classList.add("ok");
        setTimeout(() => {
          el.textContent = "Копировать";
          el.classList.remove("ok");
        }, 1200);
      };
    });
    const form = document.getElementById("kiraForm");
    const input = document.getElementById("kiraIn");
    if (form && input) {
      const autoGrow = () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 140) + "px";
      };
      autoGrow();
      input.oninput = autoGrow;
      form.onsubmit = (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = "";
        autoGrow();
        askKira(text);
      };
      input.onkeydown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          form.requestSubmit();
        }
      };
    }
    const feed = document.getElementById("feed");
    if (feed) feed.scrollTop = feed.scrollHeight;
    syncKiraViewport();
  };

  const syncKiraViewport = () => {
    const page = document.querySelector(".page-kira");
    if (!page) {
      document.body.style.height = "";
      return;
    }
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    page.style.height = h + "px";
    page.style.transform = vv ? `translateY(${vv.offsetTop}px)` : "";
  };

  const render = () => {
    const r = route();
    const key = r.name + (r.id || "");
    const routeChanged = key !== lastRouteKey;
    lastRouteKey = key;
    document.body.className = "is-" + r.name;
    if (r.name === "script") {
      app.innerHTML = scriptHtml(scripts.find((s) => s.id === r.id));
    } else if (r.name === "map") {
      app.innerHTML = mapHtml();
    } else if (r.name === "kira") {
      app.innerHTML = kiraHtml();
    } else {
      app.innerHTML = homeHtml();
    }
    bind();
    if (routeChanged && r.name !== "kira") {
      window.scrollTo(0, 0);
    }
  };

  let touchX = 0;
  document.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  document.addEventListener(
    "touchend",
    (e) => {
      const x = e.changedTouches[0].clientX;
      if (touchX < 28 && x - touchX > 70 && route().name !== "home" && route().name !== "map") {
        history.back();
      }
    },
    { passive: true }
  );

  window.addEventListener("hashchange", render);
  window.visualViewport?.addEventListener("resize", syncKiraViewport);
  window.visualViewport?.addEventListener("scroll", syncKiraViewport);
  render();
})();
