/* =========================================================
   МагнитСтрой — логика интернет-магазина (без сборки и бэкенда)
   Маршруты: #/  #/catalog  #/catalog/:cat  #/product/:id  #/search/:q
             #/cart  #/favorites  #/stores  #/delivery  #/order/:num
   ========================================================= */

/* ---------- хранилище ---------- */
function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* приватный режим — работаем в памяти */ }
}

const S = {
  cart: load('ms_cart', {}),        // { id: qty }
  fav: load('ms_fav', []),          // [id]
  store: load('ms_store', 's1'),    // выбранный магазин
};

/* ---------- утилиты ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const rub = n => n.toLocaleString('ru-RU') + ' ₽';
const byId = id => PRODUCTS.find(p => p.id === +id);
const catById = id => CATEGORIES.find(c => c.id === id);
const storeIdx = id => STORES.findIndex(s => s.id === id);
const curStore = () => STORES[storeIdx(S.store)] || STORES[0];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
const discount = p => p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
const totalStock = p => p.stock.reduce((a, b) => a + b, 0);

function stars(r) {
  const full = Math.round(r);
  return `<span class="stars" aria-label="Рейтинг ${r}">${'★'.repeat(full)}<span class="stars-off">${'★'.repeat(5 - full)}</span></span>`;
}

function availShort(p) {
  const i = storeIdx(S.store);
  const here = p.stock[i], other = p.stock[1 - i];
  if (here > 0 && other > 0) return `<span class="av av-ok">В наличии в 2 магазинах</span>`;
  if (here > 0) return `<span class="av av-ok">В наличии: ${esc(STORES[i].short)}</span>`;
  if (other > 0) return `<span class="av av-warn">Только в магазине «${esc(STORES[1 - i].short)}»</span>`;
  return `<span class="av av-no">Под заказ, 2–5 дней</span>`;
}

/* ---------- корзина / избранное ---------- */
function cartCount() { return Object.values(S.cart).reduce((a, b) => a + b, 0); }
function cartSum() { return Object.entries(S.cart).reduce((s, [id, q]) => s + (byId(id)?.price || 0) * q, 0); }
function addToCart(id, qty = 1) {
  S.cart[id] = (S.cart[id] || 0) + qty;
  save('ms_cart', S.cart); updateBadges();
  toast(`Добавлено в корзину: ${byId(id).name}`);
}
function setQty(id, qty) {
  if (qty <= 0) delete S.cart[id]; else S.cart[id] = Math.min(qty, 999);
  save('ms_cart', S.cart); updateBadges();
}
function toggleFav(id) {
  id = +id;
  const i = S.fav.indexOf(id);
  if (i >= 0) S.fav.splice(i, 1); else S.fav.push(id);
  save('ms_fav', S.fav); updateBadges();
  return i < 0;
}
function setStore(id) {
  S.store = id; save('ms_store', id);
  $('#storeName').textContent = curStore().short;
}

function updateBadges() {
  const c = cartCount(), f = S.fav.length;
  $$('[data-badge="cart"]').forEach(b => { b.textContent = c; b.hidden = !c; });
  $$('[data-badge="fav"]').forEach(b => { b.textContent = f; b.hidden = !f; });
  $$('[data-cart-sum]').forEach(el => el.textContent = c ? rub(cartSum()) : 'Корзина');
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.innerHTML = `${icon('check', 18)}<span>${esc(msg)}</span><a href="#/cart">В корзину</a>`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- компоненты ---------- */
function productImg(p, size = 72) {
  const c = catById(p.cat);
  return `<div class="pimg" style="--tile:${c.color}">${icon(c.icon, size)}<span class="pimg-brand">${esc(p.brand)}</span></div>`;
}

function buyBtn(p, big = false) {
  const inCart = S.cart[p.id];
  return inCart
    ? `<a href="#/cart" class="btn btn-incart ${big ? 'btn-lg' : ''}">${icon('check', 18)} В корзине</a>`
    : `<button class="btn btn-primary ${big ? 'btn-lg' : ''}" data-action="add" data-id="${p.id}">${big ? 'Купить' : icon('cart', 18) + ' Купить'}</button>`;
}

function card(p) {
  const d = discount(p);
  const isFav = S.fav.includes(p.id);
  return `
  <article class="pcard">
    <a href="#/product/${p.id}" class="pcard-img">${productImg(p)}</a>
    ${d ? `<span class="tag tag-sale">−${d}%</span>` : ''}
    <button class="fav-btn ${isFav ? 'on' : ''}" data-action="fav" data-id="${p.id}" aria-label="В избранное">${icon('heart', 20)}</button>
    <a href="#/product/${p.id}" class="pcard-name">${esc(p.name)}</a>
    <div class="pcard-rate">${stars(p.rating)} <span>${p.rating}</span> <span class="muted">${p.reviews}</span></div>
    ${availShort(p)}
    <div class="pcard-bottom">
      <div class="price">${rub(p.price)}${d ? `<s>${rub(p.old)}</s>` : ''}<small>за ${esc(p.unit)}</small></div>
      ${buyBtn(p)}
    </div>
  </article>`;
}

function crumbs(items) {
  return `<nav class="crumbs"><a href="#/">Главная</a>${items.map(([t, h]) => h ? `<span>/</span><a href="${h}">${esc(t)}</a>` : `<span>/</span><b>${esc(t)}</b>`).join('')}</nav>`;
}

function rail(title, list, link) {
  return `
  <section class="block">
    <div class="block-head"><h2>${title}</h2>${link ? `<a href="${link}" class="more">Смотреть все ${icon('chevron', 16)}</a>` : ''}
      <div class="rail-nav"><button data-rail="-1" aria-label="Назад">${icon('chevronLeft', 20)}</button><button data-rail="1" aria-label="Вперёд">${icon('chevron', 20)}</button></div>
    </div>
    <div class="rail">${list.map(card).join('')}</div>
  </section>`;
}

/* ---------- страницы ---------- */
const pages = {};

pages.home = () => {
  const hits = [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 10);
  const sale = PRODUCTS.filter(p => p.old).sort((a, b) => discount(b) - discount(a));
  const tools = PRODUCTS.filter(p => p.cat === 'tools');
  return `
  <section class="hero">
    <div class="slider" id="slider">
      ${BANNERS.map((b, i) => `
        <a href="${b.href}" class="slide tone-${b.tone} ${i === 0 ? 'active' : ''}">
          <div class="slide-txt"><h1>${esc(b.title)}</h1><p>${esc(b.text)}</p><span class="btn btn-white">${esc(b.btn)}</span></div>
          <div class="slide-art">${icon(b.icon, 180)}</div>
        </a>`).join('')}
      <div class="dots">${BANNERS.map((_, i) => `<button data-slide="${i}" class="${i === 0 ? 'on' : ''}" aria-label="Слайд ${i + 1}"></button>`).join('')}</div>
    </div>
    <div class="hero-side">
      <a href="#/stores" class="promo promo-a">
        <b>2 магазина в городе</b><span>Самовывоз через 15 минут после заказа</span>${icon('store', 54)}
      </a>
      <a href="#/catalog/build" class="promo promo-b">
        <b>Стройматериалы по цене склада</b><span>Цемент, смеси, блоки, утеплитель</span>${icon('bricks', 54)}
      </a>
    </div>
  </section>

  <section class="perks">
    <div>${icon('store', 28)}<span><b>Самовывоз бесплатно</b>из двух магазинов</span></div>
    <div>${icon('truck', 28)}<span><b>Доставка в день заказа</b>с погрузкой и разгрузкой</span></div>
    <div>${icon('shield', 28)}<span><b>Гарантия и обмен</b>возврат 14 дней</span></div>
    <div>${icon('card', 28)}<span><b>Оплата удобно</b>картой, наличными, по счёту</span></div>
  </section>

  <section class="block">
    <div class="block-head"><h2>Популярные категории</h2><a href="#/catalog" class="more">Весь каталог ${icon('chevron', 16)}</a></div>
    <div class="cats">
      ${CATEGORIES.map(c => `<a href="#/catalog/${c.id}" class="cat" style="--tile:${c.color}"><span class="cat-ico">${icon(c.icon, 44)}</span><span>${esc(c.name)}</span></a>`).join('')}
    </div>
  </section>

  ${rail('Хиты продаж', hits, '#/catalog')}
  ${rail('Скидки недели', sale, '#/catalog?sale=1')}
  ${rail('Инструмент', tools, '#/catalog/tools')}

  <section class="block">
    <div class="block-head"><h2>Наши магазины</h2><a href="#/stores" class="more">Подробнее ${icon('chevron', 16)}</a></div>
    <div class="stores-grid">${STORES.map(storeCard).join('')}</div>
  </section>

  <section class="block">
    <div class="block-head"><h2>Бренды</h2></div>
    <div class="brands">${[...new Set(PRODUCTS.map(p => p.brand))].slice(0, 14).map(b => `<a href="#/search/${encodeURIComponent(b)}">${esc(b)}</a>`).join('')}</div>
  </section>`;
};

function storeCard(s) {
  const mine = s.id === S.store;
  return `
  <div class="store-card ${mine ? 'mine' : ''}">
    <div class="store-map">${icon('pin', 40)}<span>${esc(s.address)}</span></div>
    <div class="store-body">
      <h3>${esc(s.name)} ${mine ? '<span class="tag tag-ok">Ваш магазин</span>' : ''}</h3>
      <p>${icon('pin', 16)} ${esc(SHOP.city)}, ${esc(s.address)}</p>
      <p>${icon('clock', 16)} ${esc(s.hours)}</p>
      <p>${icon('phone', 16)} <a href="tel:${s.phone.replace(/[^\d+]/g, '')}">${esc(s.phone)}</a></p>
      <ul class="feat">${s.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      <div class="store-actions">
        ${mine ? '' : `<button class="btn btn-primary" data-action="pick-store" data-store="${s.id}">Выбрать этот магазин</button>`}
        <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://yandex.ru/maps/?text=${encodeURIComponent(SHOP.city + ', ' + s.address)}">Маршрут</a>
      </div>
    </div>
  </div>`;
}

pages.catalogRoot = () => `
  ${crumbs([['Каталог']])}
  <h1 class="page-title">Каталог товаров</h1>
  <div class="cat-list">
    ${CATEGORIES.map(c => `
      <div class="cat-big">
        <a href="#/catalog/${c.id}" class="cat-big-img" style="--tile:${c.color}">${icon(c.icon, 56)}</a>
        <div><a href="#/catalog/${c.id}" class="cat-big-name">${esc(c.name)}</a>
          <span class="muted">${PRODUCTS.filter(p => p.cat === c.id).length} товаров</span>
          <ul>${c.subs.map(s => `<li><a href="#/catalog/${c.id}">${esc(s)}</a></li>`).join('')}</ul>
        </div>
      </div>`).join('')}
  </div>`;

/* фильтры листинга */
let F = null;
function freshFilters(key, extra = {}) {
  return { key, brands: new Set(), min: '', max: '', inStock: false, sale: false, sort: 'pop', ...extra };
}

function listing(title, base, crumbItems, key, extra) {
  if (!F || F.key !== key) F = freshFilters(key, extra);
  const brands = [...new Set(base.map(p => p.brand))].sort();
  const prices = base.map(p => p.price);
  return `
  ${crumbs(crumbItems)}
  <h1 class="page-title">${esc(title)} <span class="muted" id="cnt"></span></h1>
  <div class="listing">
    <aside class="filters" id="filters">
      <div class="f-head"><b>Фильтры</b><button class="link" data-action="reset">Сбросить</button></div>
      <div class="f-group">
        <label class="switch"><input type="checkbox" data-f="inStock" ${F.inStock ? 'checked' : ''}><span></span>В наличии в магазине «${esc(curStore().short)}»</label>
        <label class="switch"><input type="checkbox" data-f="sale" ${F.sale ? 'checked' : ''}><span></span>Со скидкой</label>
      </div>
      <div class="f-group"><b>Цена, ₽</b>
        <div class="f-price">
          <input type="number" inputmode="numeric" data-f="min" placeholder="от ${prices.length ? Math.min(...prices) : 0}" value="${F.min}">
          <input type="number" inputmode="numeric" data-f="max" placeholder="до ${prices.length ? Math.max(...prices) : 0}" value="${F.max}">
        </div>
      </div>
      <div class="f-group"><b>Бренд</b>
        ${brands.map(b => `<label class="chk"><input type="checkbox" data-brand="${esc(b)}" ${F.brands.has(b) ? 'checked' : ''}> ${esc(b)} <span class="muted">${base.filter(p => p.brand === b).length}</span></label>`).join('')}
      </div>
      <button class="btn btn-primary f-apply" data-action="close-filters">Показать</button>
    </aside>
    <div class="results">
      <div class="toolbar">
        <button class="btn btn-ghost only-mobile" data-action="open-filters">${icon('filter', 18)} Фильтры</button>
        <select data-f="sort" aria-label="Сортировка">
          <option value="pop" ${F.sort === 'pop' ? 'selected' : ''}>Сначала популярные</option>
          <option value="cheap" ${F.sort === 'cheap' ? 'selected' : ''}>Сначала дешёвые</option>
          <option value="exp" ${F.sort === 'exp' ? 'selected' : ''}>Сначала дорогие</option>
          <option value="rate" ${F.sort === 'rate' ? 'selected' : ''}>По рейтингу</option>
          <option value="sale" ${F.sort === 'sale' ? 'selected' : ''}>По размеру скидки</option>
        </select>
      </div>
      <div class="grid" id="grid"></div>
    </div>
  </div>`;
}

let listingBase = [];
function renderGrid() {
  const i = storeIdx(S.store);
  let list = listingBase.filter(p =>
    (!F.brands.size || F.brands.has(p.brand)) &&
    (!F.inStock || p.stock[i] > 0) &&
    (!F.sale || p.old) &&
    (F.min === '' || p.price >= +F.min) &&
    (F.max === '' || p.price <= +F.max));
  const sorters = {
    pop: (a, b) => b.reviews - a.reviews, cheap: (a, b) => a.price - b.price, exp: (a, b) => b.price - a.price,
    rate: (a, b) => b.rating - a.rating, sale: (a, b) => discount(b) - discount(a),
  };
  list.sort(sorters[F.sort]);
  $('#cnt').textContent = `${list.length} ${plural(list.length, 'товар', 'товара', 'товаров')}`;
  $('#grid').innerHTML = list.length ? list.map(card).join('')
    : `<div class="empty">${icon('search', 48)}<p>По выбранным фильтрам ничего не найдено</p><button class="btn btn-ghost" data-action="reset">Сбросить фильтры</button></div>`;
}

pages.product = id => {
  const p = byId(id);
  if (!p) return pages.notFound();
  const c = catById(p.cat), d = discount(p), isFav = S.fav.includes(p.id);
  const similar = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id);
  return `
  ${crumbs([['Каталог', '#/catalog'], [c.name, '#/catalog/' + c.id], [p.name]])}
  <div class="pp">
    <div class="pp-gallery">${productImg(p, 160)}${d ? `<span class="tag tag-sale">−${d}%</span>` : ''}</div>
    <div class="pp-info">
      <h1>${esc(p.name)}</h1>
      <div class="pp-meta">${stars(p.rating)} <b>${p.rating}</b> <span class="muted">${p.reviews} ${plural(p.reviews, 'отзыв', 'отзыва', 'отзывов')}</span><span class="muted">Код товара: ${p.id}</span></div>
      <p class="pp-desc">${esc(p.desc)}</p>
      <h3>Основные характеристики</h3>
      <dl class="specs">${Object.entries(p.specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}<div><dt>Бренд</dt><dd>${esc(p.brand)}</dd></div></dl>
    </div>
    <aside class="pp-buy">
      <div class="price price-lg">${rub(p.price)}${d ? `<s>${rub(p.old)}</s>` : ''}<small>за ${esc(p.unit)}</small></div>
      <div class="pp-btns">${buyBtn(p, true)}<button class="fav-btn fav-lg ${isFav ? 'on' : ''}" data-action="fav" data-id="${p.id}" aria-label="В избранное">${icon('heart', 22)}</button></div>
      <div class="pp-avail">
        <b>Наличие в магазинах</b>
        ${STORES.map((s, i) => `
          <label class="av-row ${s.id === S.store ? 'sel' : ''}">
            <input type="radio" name="pstore" data-action="pick-store" data-store="${s.id}" ${s.id === S.store ? 'checked' : ''}>
            <span class="av-name">${esc(s.short)}<small>${esc(s.address)}</small></span>
            <span class="${p.stock[i] > 0 ? 'av-ok' : 'av-no'}">${p.stock[i] > 0 ? (p.stock[i] > 50 ? 'много' : p.stock[i] + ' ' + p.unit.replace('.', '')) : 'нет'}</span>
          </label>`).join('')}
        <p class="muted small">${p.stock[storeIdx(S.store)] > 0 ? 'Самовывоз сегодня — через 15 минут после заказа' : totalStock(p) ? 'Можно забрать в другом магазине или привезти в ваш за 1 день' : 'Под заказ, срок 2–5 дней'}</p>
      </div>
      <div class="pp-ship">${icon('truck', 20)}<span>Доставка от 490 ₽, завтра или в день заказа</span></div>
    </aside>
  </div>
  ${similar.length ? rail('Похожие товары', similar) : ''}`;
};

pages.cart = () => {
  const items = Object.entries(S.cart).map(([id, q]) => ({ p: byId(id), q })).filter(x => x.p);
  if (!items.length) return `
    ${crumbs([['Корзина']])}
    <div class="empty big">${icon('cart', 64)}<h1>Корзина пуста</h1><p>Загляните в каталог — там много полезного для стройки и ремонта</p><a href="#/catalog" class="btn btn-primary btn-lg">Перейти в каталог</a></div>`;
  const count = cartCount(), sum = cartSum();
  return `
  ${crumbs([['Корзина']])}
  <h1 class="page-title">Корзина <span class="muted">${count} ${plural(count, 'товар', 'товара', 'товаров')}</span></h1>
  <div class="cart">
    <div class="cart-main">
      <div class="cart-list">
        ${items.map(({ p, q }) => `
          <div class="ci">
            <a href="#/product/${p.id}" class="ci-img">${productImg(p, 40)}</a>
            <div class="ci-info"><a href="#/product/${p.id}">${esc(p.name)}</a>${availShort(p)}</div>
            <div class="qty">
              <button data-action="dec" data-id="${p.id}" aria-label="Меньше">−</button>
              <input type="number" min="1" value="${q}" data-qty="${p.id}" aria-label="Количество">
              <button data-action="inc" data-id="${p.id}" aria-label="Больше">+</button>
            </div>
            <div class="ci-price"><b>${rub(p.price * q)}</b>${q > 1 ? `<small>${rub(p.price)} / ${esc(p.unit)}</small>` : ''}</div>
            <button class="icon-btn" data-action="remove" data-id="${p.id}" aria-label="Удалить">${icon('trash', 20)}</button>
          </div>`).join('')}
      </div>

      <form class="checkout" id="checkout" novalidate>
        <h2>Оформление заказа</h2>
        <div class="seg">
          <label><input type="radio" name="method" value="pickup" checked><span>${icon('store', 18)} Самовывоз — бесплатно</span></label>
          <label><input type="radio" name="method" value="delivery"><span>${icon('truck', 18)} Доставка — от 490 ₽</span></label>
        </div>
        <div id="pickupBox">
          <p class="lbl">Магазин для самовывоза</p>
          <div class="pick-stores">
            ${STORES.map((s, i) => {
              const miss = items.filter(({ p, q }) => p.stock[i] < q).length;
              return `<label class="pick ${s.id === S.store ? 'sel' : ''}">
                <input type="radio" name="store" value="${s.id}" ${s.id === S.store ? 'checked' : ''}>
                <b>${esc(s.name)}</b><span>${esc(s.address)} · ${esc(s.hours)}</span>
                <em class="${miss ? 'av-warn' : 'av-ok'}">${miss ? `${miss} ${plural(miss, 'товар', 'товара', 'товаров')} привезём за 1 день` : 'Всё в наличии — заберите сегодня'}</em>
              </label>`;
            }).join('')}
          </div>
        </div>
        <div id="deliveryBox" hidden>
          <label class="fld"><span>Адрес доставки</span><input name="address" placeholder="Улица, дом, квартира"></label>
          <label class="fld"><span>Удобная дата</span><input name="date" type="date"></label>
        </div>
        <div class="row2">
          <label class="fld"><span>Имя *</span><input name="name" required autocomplete="name"></label>
          <label class="fld"><span>Телефон *</span><input name="phone" type="tel" required placeholder="+7 (___) ___-__-__" autocomplete="tel"></label>
        </div>
        <label class="fld"><span>Комментарий</span><textarea name="comment" rows="2" placeholder="Например: нужен распил листов"></textarea></label>
        <p class="lbl">Оплата</p>
        <div class="seg">
          <label><input type="radio" name="pay" value="receipt" checked><span>При получении</span></label>
          <label><input type="radio" name="pay" value="invoice"><span>По счёту для юрлиц</span></label>
        </div>
      </form>
    </div>
    <aside class="cart-sum">
      <div class="sum-row"><span>Товары (${count})</span><b>${rub(sum)}</b></div>
      <div class="sum-row"><span>Доставка</span><b id="shipCost">бесплатно</b></div>
      <div class="sum-total"><span>Итого</span><b id="totalSum">${rub(sum)}</b></div>
      <button class="btn btn-primary btn-lg btn-block" form="checkout" type="submit">Оформить заказ</button>
      <p class="muted small">Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных</p>
    </aside>
  </div>`;
};

pages.order = num => {
  const orders = load('ms_orders', []);
  const o = orders.find(x => x.num === num);
  if (!o) return pages.notFound();
  const st = STORES.find(s => s.id === o.store);
  return `<div class="empty big ok">${icon('check', 64)}
    <h1>Заказ № ${esc(o.num)} оформлен</h1>
    <p>${o.method === 'pickup'
      ? `Заберите его в магазине <b>${esc(st.name)}</b>, ${esc(st.address)}. Мы позвоним на номер ${esc(o.phone)}, когда заказ будет собран.`
      : `Менеджер позвонит на номер ${esc(o.phone)}, чтобы согласовать время доставки.`}</p>
    <p class="muted">Сумма заказа: ${rub(o.sum)}</p>
    <a href="#/" class="btn btn-primary btn-lg">На главную</a></div>`;
};

pages.favorites = () => {
  const list = S.fav.map(byId).filter(Boolean);
  return `${crumbs([['Избранное']])}<h1 class="page-title">Избранное</h1>
    ${list.length ? `<div class="grid">${list.map(card).join('')}</div>`
      : `<div class="empty big">${icon('heart', 64)}<h1>Здесь пока пусто</h1><p>Нажмите на сердечко у товара, чтобы сохранить его</p><a href="#/catalog" class="btn btn-primary btn-lg">В каталог</a></div>`}`;
};

pages.stores = () => `
  ${crumbs([['Магазины']])}
  <h1 class="page-title">Магазины ${esc(SHOP.name)}</h1>
  <p class="lead">Два магазина в городе. Выберите удобный — на сайте будет показано наличие товаров именно в нём.</p>
  <div class="stores-grid">${STORES.map(storeCard).join('')}</div>`;

pages.delivery = () => `
  ${crumbs([['Доставка и оплата']])}
  <h1 class="page-title">Доставка и оплата</h1>
  <div class="info-grid">
    <div class="info">${icon('store', 32)}<h3>Самовывоз</h3><p>Бесплатно из любого из двух магазинов. Если товар есть в наличии — заказ собираем за 15 минут. Если товара нет в выбранном магазине, привезём его из другого за 1 день.</p></div>
    <div class="info">${icon('truck', 32)}<h3>Доставка по городу</h3><p>Легковая машина — от 490 ₽, грузовая с манипулятором — от 2 500 ₽. Доставка в день заказа при оформлении до 14:00.</p></div>
    <div class="info">${icon('box', 32)}<h3>Подъём на этаж</h3><p>Грузчики поднимут стройматериалы на этаж. Стоимость зависит от веса и наличия лифта — уточняйте у менеджера.</p></div>
    <div class="info">${icon('card', 32)}<h3>Оплата</h3><p>Наличными или картой при получении, по QR-коду СБП. Для юридических лиц — по безналичному расчёту с НДС.</p></div>
    <div class="info">${icon('shield', 32)}<h3>Возврат и обмен</h3><p>Товар надлежащего качества можно вернуть в течение 14 дней в любом из магазинов, если сохранены упаковка и чек.</p></div>
    <div class="info">${icon('percent', 32)}<h3>Скидки для профи</h3><p>Строителям и бригадам — персональные цены и отсрочка платежа. Оставьте заявку по телефону ${esc(SHOP.phone)}.</p></div>
  </div>`;

pages.notFound = () => `<div class="empty big">${icon('search', 64)}<h1>Страница не найдена</h1><a href="#/" class="btn btn-primary btn-lg">На главную</a></div>`;

/* ---------- роутер ---------- */
function route() {
  const raw = location.hash.slice(1) || '/';
  const [path, query = ''] = raw.split('?');
  const qs = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean);
  const app = $('#app');
  let html, after;
  closeMenus();

  switch (parts[0]) {
    case undefined: html = pages.home(); after = initHome; break;
    case 'catalog':
      if (parts[1]) {
        const c = catById(parts[1]);
        if (!c) { html = pages.notFound(); break; }
        listingBase = PRODUCTS.filter(p => p.cat === c.id);
        html = listing(c.name, listingBase, [['Каталог', '#/catalog'], [c.name]], 'cat:' + c.id);
        after = renderGrid;
      } else if (qs.get('sale') || qs.get('all')) {
        listingBase = PRODUCTS;
        html = listing(qs.get('sale') ? 'Скидки' : 'Все товары', listingBase, [['Каталог', '#/catalog'], [qs.get('sale') ? 'Скидки' : 'Все товары']], 'all:' + query, { sale: !!qs.get('sale') });
        after = renderGrid;
      } else html = pages.catalogRoot();
      break;
    case 'search': {
      const q = decodeURIComponent(parts.slice(1).join('/'));
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      listingBase = PRODUCTS.filter(p => {
        const hay = `${p.name} ${p.brand} ${catById(p.cat).name} ${catById(p.cat).subs.join(' ')}`.toLowerCase();
        return words.every(w => hay.includes(w));
      });
      $('#q').value = q;
      html = listing(`Результаты поиска «${q}»`, listingBase, [['Поиск']], 'q:' + q);
      after = renderGrid;
      break;
    }
    case 'product': html = pages.product(parts[1]); break;
    case 'cart': html = pages.cart(); after = initCheckout; break;
    case 'order': html = pages.order(parts[1]); break;
    case 'favorites': html = pages.favorites(); break;
    case 'stores': html = pages.stores(); break;
    case 'delivery': html = pages.delivery(); break;
    default: html = pages.notFound();
  }
  app.innerHTML = html;
  if (after) after();
  $$('.tabbar a').forEach(a => a.classList.toggle('on', ('#' + path).startsWith(a.getAttribute('href')) && (a.getAttribute('href') !== '#/' || path === '/')));
  window.scrollTo(0, 0);
}

/* ---------- главная: слайдер ---------- */
let slideTimer;
function initHome() {
  let cur = 0;
  const slides = $$('#slider .slide'), dots = $$('#slider .dots button');
  const go = n => {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === cur));
    dots.forEach((d, i) => d.classList.toggle('on', i === cur));
  };
  dots.forEach(d => d.onclick = e => { e.preventDefault(); go(+d.dataset.slide); });
  clearInterval(slideTimer);
  slideTimer = setInterval(() => { if (!$('#slider')) return clearInterval(slideTimer); go(cur + 1); }, 6000);
}

/* ---------- оформление заказа ---------- */
function initCheckout() {
  const form = $('#checkout');
  if (!form) return;
  const E = form.elements;
  const recalc = () => {
    const delivery = E.method.value === 'delivery';
    $('#pickupBox').hidden = delivery;
    $('#deliveryBox').hidden = !delivery;
    const ship = delivery ? 490 : 0;
    $('#shipCost').textContent = ship ? rub(ship) : 'бесплатно';
    $('#totalSum').textContent = rub(cartSum() + ship);
    $$('.pick', form).forEach(l => l.classList.toggle('sel', $('input', l).checked));
  };
  form.addEventListener('change', recalc);
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(f => {
      const bad = !f.value.trim() || (f.name === 'phone' && f.value.replace(/\D/g, '').length < 10);
      f.closest('.fld').classList.toggle('err', bad);
      if (bad) ok = false;
    });
    if (E.method.value === 'delivery' && !E.address.value.trim()) { E.address.closest('.fld').classList.add('err'); ok = false; }
    if (!ok) { toastPlain('Заполните обязательные поля'); return; }
    const num = String(Date.now()).slice(-6);
    const order = {
      num, date: new Date().toISOString(), method: E.method.value, store: E.store?.value || S.store,
      name: E.name.value.trim(), phone: E.phone.value.trim(), address: E.address.value.trim(),
      comment: E.comment.value.trim(), pay: E.pay.value,
      items: { ...S.cart }, sum: cartSum() + (E.method.value === 'delivery' ? 490 : 0),
    };
    // TODO: отправить заказ на сервер / в Telegram / на почту. Сейчас он сохраняется только в браузере.
    const orders = load('ms_orders', []); orders.push(order); save('ms_orders', orders);
    S.cart = {}; save('ms_cart', S.cart); updateBadges();
    location.hash = '#/order/' + num;
  });
  recalc();
}
function toastPlain(msg) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- меню каталога и выбор магазина ---------- */
function buildMega() {
  $('#megaCats').innerHTML = CATEGORIES.map((c, i) => `<a href="#/catalog/${c.id}" data-mega="${i}" class="${i === 0 ? 'on' : ''}">${icon(c.icon, 22)}<span>${esc(c.name)}</span>${icon('chevron', 16, 'arr')}</a>`).join('');
  const showSubs = i => {
    const c = CATEGORIES[i];
    $('#megaSubs').innerHTML = `<a class="mega-title" href="#/catalog/${c.id}">${esc(c.name)}</a>
      <div class="mega-cols">${c.subs.map(s => `<a href="#/catalog/${c.id}">${esc(s)}</a>`).join('')}</div>
      <div class="mega-hits">${PRODUCTS.filter(p => p.cat === c.id).slice(0, 3).map(p => `<a href="#/product/${p.id}" class="mini">${productImg(p, 28)}<span>${esc(p.name)}<b>${rub(p.price)}</b></span></a>`).join('')}</div>`;
    $$('#megaCats a').forEach((a, j) => a.classList.toggle('on', j === i));
  };
  $$('#megaCats a').forEach(a => a.addEventListener('mouseenter', () => showSubs(+a.dataset.mega)));
  showSubs(0);
}
function closeMenus() {
  $('#mega').classList.remove('open');
  $('#catBtn').classList.remove('open');
  $('#storeModal').hidden = true;
  $('#filters')?.classList.remove('open');
  document.body.classList.remove('lock');
}
function openStoreModal() {
  $('#storeList').innerHTML = STORES.map(s => `
    <button class="store-opt ${s.id === S.store ? 'sel' : ''}" data-action="pick-store" data-store="${s.id}">
      ${icon('store', 28)}<span><b>${esc(s.name)}</b>${esc(s.address)}<small>${esc(s.hours)}</small></span>${s.id === S.store ? icon('check', 22) : ''}
    </button>`).join('');
  $('#storeModal').hidden = false;
  document.body.classList.add('lock');
}

/* ---------- обработчики (делегирование) ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-action], [data-rail], #catBtn, #storeBtn, [data-close]');
  if (!t) {
    if (!e.target.closest('#mega')) { $('#mega').classList.remove('open'); $('#catBtn').classList.remove('open'); }
    return;
  }
  if (t.id === 'catBtn') {
    e.preventDefault();
    if (matchMedia('(max-width: 900px)').matches) { location.hash = '#/catalog'; return; }
    $('#mega').classList.toggle('open'); t.classList.toggle('open');
    return;
  }
  if (t.id === 'storeBtn') { openStoreModal(); return; }
  if (t.hasAttribute('data-close')) { closeMenus(); return; }
  if (t.dataset.rail) {
    const rail = t.closest('.block').querySelector('.rail');
    rail.scrollBy({ left: +t.dataset.rail * rail.clientWidth * 0.8, behavior: 'smooth' });
    return;
  }
  const id = t.dataset.id;
  switch (t.dataset.action) {
    case 'add': addToCart(+id); t.outerHTML = buyBtn(byId(id), t.classList.contains('btn-lg')); break;
    case 'fav': t.classList.toggle('on', toggleFav(id)); if (location.hash === '#/favorites') route(); break;
    case 'inc': setQty(id, S.cart[id] + 1); route(); break;
    case 'dec': setQty(id, S.cart[id] - 1); route(); break;
    case 'remove': setQty(id, 0); route(); break;
    case 'pick-store': {
      const changed = t.dataset.store !== S.store;
      setStore(t.dataset.store); closeMenus();
      if (changed) { toastPlain(`Выбран магазин «${curStore().short}»`); }
      route(); break;
    }
    case 'reset': F = freshFilters(F.key); route(); break;
    case 'open-filters': $('#filters').classList.add('open'); document.body.classList.add('lock'); break;
    case 'close-filters': $('#filters').classList.remove('open'); document.body.classList.remove('lock'); break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (!F || !$('#grid')) return;
  if (t.dataset.f === 'min' || t.dataset.f === 'max') { F[t.dataset.f] = t.value; renderGrid(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.qty) { setQty(t.dataset.qty, Math.max(1, parseInt(t.value) || 1)); route(); return; }
  if (!F || !$('#grid')) return;
  if (t.dataset.brand) { t.checked ? F.brands.add(t.dataset.brand) : F.brands.delete(t.dataset.brand); renderGrid(); }
  else if (t.dataset.f === 'inStock' || t.dataset.f === 'sale') { F[t.dataset.f] = t.checked; renderGrid(); }
  else if (t.dataset.f === 'sort') { F.sort = t.value; renderGrid(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });

/* поиск с подсказками */
function initSearch() {
  const form = $('#searchForm'), q = $('#q'), box = $('#suggest');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = q.value.trim();
    box.hidden = true;
    if (v) location.hash = '#/search/' + encodeURIComponent(v);
  });
  q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase();
    if (v.length < 2) { box.hidden = true; return; }
    const cats = CATEGORIES.filter(c => c.name.toLowerCase().includes(v) || c.subs.some(s => s.toLowerCase().includes(v))).slice(0, 3);
    const prods = PRODUCTS.filter(p => (p.name + ' ' + p.brand).toLowerCase().includes(v)).slice(0, 6);
    if (!cats.length && !prods.length) { box.innerHTML = `<div class="sg-empty">Ничего не найдено</div>`; box.hidden = false; return; }
    box.innerHTML =
      cats.map(c => `<a href="#/catalog/${c.id}" class="sg-cat">${icon(c.icon, 18)} ${esc(c.name)}</a>`).join('') +
      prods.map(p => `<a href="#/product/${p.id}" class="sg-item">${productImg(p, 22)}<span>${esc(p.name)}</span><b>${rub(p.price)}</b></a>`).join('');
    box.hidden = false;
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) box.hidden = true; });
  box.addEventListener('click', () => { box.hidden = true; });
}

/* ---------- старт ---------- */
function init() {
  $$('[data-icon]').forEach(el => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, +el.dataset.size || 24)); });
  $('#storeName').textContent = curStore().short;
  $$('[data-shop-phone]').forEach(el => { el.textContent = SHOP.phone; el.href = 'tel:' + SHOP.phone.replace(/[^\d+]/g, ''); });
  $('#footStores').innerHTML = STORES.map(s => `<li><b>${esc(s.short)}</b><br>${esc(s.address)}<br><span>${esc(s.hours)}</span></li>`).join('');
  $('#footCats').innerHTML = CATEGORIES.slice(0, 6).map(c => `<li><a href="#/catalog/${c.id}">${esc(c.name)}</a></li>`).join('');
  $('#year').textContent = new Date().getFullYear();
  buildMega();
  initSearch();
  updateBadges();
  window.addEventListener('hashchange', route);
  route();
}
init();
