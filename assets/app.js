// Simple static store config (edit here)
const STORE = {
  whatsappNumber: "212600000000", // remplace par ton numero (format international, sans +)
  supportHours: "09:00–22:00",
  currency: "DH",
  products: [
    {
      id: "mini-imprimante",
      name: "Mini Imprimante Thermique Bluetooth (Sans Encre)",
      shortName: "Mini Imprimante Bluetooth",
      priceMAD: 249,
      compareAtMAD: 399,
      offerLabel: "-38% اليوم 🔥",
      stock: 18,
      featured: true,
      description: "Imprime notes, listes et etiquettes en 1 clic depuis ton telephone.",
      images: [
        "assets/images/imprimante-1.svg",
        "assets/images/imprimante-2.svg",
        "assets/images/imprimante-3.svg",
      ],
    },
    {
      id: "lampe-led",
      name: "Lampe LED Rechargeable 3 Modes",
      shortName: "Lampe LED Rechargeable",
      priceMAD: 189,
      compareAtMAD: 279,
      offerLabel: "-32% اليوم",
      stock: 7,
      featured: false,
      description: "Lumiere douce, puissante et portable pour chambre, bureau et voyage.",
      images: [
        "assets/images/lampe-1.svg",
        "assets/images/lampe-2.svg",
      ],
    },
    {
      id: "hacheur-mini",
      name: "Mini Hacheur Electrique USB",
      shortName: "Mini Hacheur USB",
      priceMAD: 159,
      compareAtMAD: 229,
      offerLabel: "-30% promo",
      stock: 0,
      featured: false,
      description: "Hache ail, oignon et legumes rapidement. Pratique pour la cuisine.",
      images: [
        "assets/images/hacheur-1.svg",
        "assets/images/hacheur-2.svg",
      ],
    },
  ],
};
const STORE_KEY = "dropsh_store_v1";
const DEFAULT_STORE = JSON.parse(JSON.stringify(STORE));

function formatMAD(n){
  try { return new Intl.NumberFormat("fr-MA").format(n) + " DH"; }
  catch { return n + " DH"; }
}

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function deepClone(obj){
  return JSON.parse(JSON.stringify(obj));
}

function safeProducts(list){
  if(!Array.isArray(list)) return deepClone(STORE.products);
  const cleaned = list
    .filter((p) => p && p.id && p.name)
    .map((p) => ({
      id: String(p.id),
      name: String(p.name || ""),
      shortName: String(p.shortName || p.name || ""),
      priceMAD: Number(p.priceMAD || 0),
      compareAtMAD: Number(p.compareAtMAD || 0),
      offerLabel: String(p.offerLabel || ""),
      stock: Number(p.stock || 0),
      featured: Boolean(p.featured),
      description: String(p.description || ""),
      images: Array.isArray(p.images) ? p.images.map((s)=>String(s).trim()).filter(Boolean) : [],
    }));
  return cleaned.length ? cleaned : deepClone(STORE.products);
}

function loadStoreState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return;
    const parsed = JSON.parse(raw);
    if(parsed && typeof parsed === "object"){
      if(parsed.whatsappNumber) STORE.whatsappNumber = String(parsed.whatsappNumber);
      if(parsed.supportHours) STORE.supportHours = String(parsed.supportHours);
      STORE.products = safeProducts(parsed.products);
    }
  }catch(_e){}
}

function saveStoreState(){
  const payload = {
    whatsappNumber: STORE.whatsappNumber,
    supportHours: STORE.supportHours,
    products: STORE.products,
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
}

function getProductById(id){
  const safeId = String(id || "");
  return STORE.products.find((p)=>p.id === safeId) || STORE.products[0];
}

function getCurrentProduct(){
  const id = new URLSearchParams(window.location.search).get("id");
  if(id) return getProductById(id);
  return STORE.products.find((p)=>p.featured) || STORE.products[0];
}

function buildOrderMessage({product, name, phone, city, address, qty, note}){
  const lines = [
    "سلام، بغيت نأكد الطلب ✅",
    "",
    `Produit: ${product.name}`,
    `Quantité: ${qty}`,
    `Prix: ${formatMAD(product.priceMAD)} (Paiement à la livraison)`,
    "",
    `Nom: ${name}`,
    `Téléphone: ${phone}`,
    `Ville: ${city}`,
    `Adresse: ${address}`,
  ];
  if(note?.trim()) lines.push("", `Note: ${note.trim()}`);
  lines.push("", "Merci 🙏");
  return lines.join("\n");
}

function waLink(message){
  const num = String(STORE.whatsappNumber || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${num}?text=${text}`;
}

function setText(id, value){
  const el = qs(`[data-bind="${id}"]`);
  if(el) el.textContent = value;
}

function setAllText(id, value){
  qsa(`[data-bind="${id}"]`).forEach((el) => {
    el.textContent = value;
  });
}

function getStockLabel(stock){
  if(stock <= 0) return "Rupture de stock";
  if(stock <= 5) return `Stock faible: ${stock}`;
  return `Stock disponible: ${stock}`;
}

function getStockClass(stock){
  if(stock <= 0) return "badge red";
  if(stock <= 5) return "badge red";
  return "badge green";
}

function renderHeroImage(product){
  const img = qs('[data-bind="heroImage"]');
  if(!img) return;
  const firstImg = product.images?.[0];
  if(firstImg){
    img.src = firstImg;
    img.alt = product.shortName;
    return;
  }
  img.remove();
}

function renderGallery(product){
  const main = qs("#mainProductImage");
  const thumbs = qs("#galleryThumbs");
  if(!main || !thumbs || !Array.isArray(product.images) || !product.images.length) return;

  main.src = product.images[0];
  main.alt = product.shortName;
  thumbs.innerHTML = "";
  product.images.forEach((src, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "thumb-btn";
    b.setAttribute("aria-label", `Image ${idx + 1}`);
    b.innerHTML = `<img src="${src}" alt="${product.shortName} ${idx + 1}" />`;
    b.addEventListener("click", () => {
      main.src = src;
      qsa(".thumb-btn", thumbs).forEach((el)=>el.classList.remove("active"));
      b.classList.add("active");
    });
    if(idx === 0) b.classList.add("active");
    thumbs.appendChild(b);
  });
}

function renderProductList(){
  const host = qs("#productList");
  if(!host) return;
  host.innerHTML = "";
  STORE.products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "card white product-card";
    const stockClass = getStockClass(product.stock);
    const stockText = getStockLabel(product.stock);
    const disabled = product.stock <= 0 ? "disabled" : "";
    const cover = product.images?.[0] || "";
    card.innerHTML = `
      <img class="product-cover" src="${cover}" alt="${product.shortName}" />
      <h3>${product.shortName}</h3>
      <p>${product.description}</p>
      <div class="pricebox" style="margin-top:8px">
        <div class="price">${formatMAD(product.priceMAD)}</div>
        <div class="compare">${formatMAD(product.compareAtMAD)}</div>
      </div>
      <div class="badge-line">
        <span class="${stockClass}">${stockText}</span>
      </div>
      <div class="cta-row">
        <a class="btn btn-secondary" href="produit.html?id=${encodeURIComponent(product.id)}">Voir details</a>
        <button class="btn btn-primary" data-product-id="${product.id}" ${disabled}>Commander</button>
      </div>
    `;
    host.appendChild(card);
  });

  qsa("#productList [data-product-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = getProductById(btn.getAttribute("data-product-id"));
      if(product.stock <= 0) return;
      openModal();
      const productSelect = qs("#orderProduct");
      if(productSelect) productSelect.value = product.id;
    });
  });
}

function updatePageForProduct(product){
  setAllText("productName", product.name);
  setAllText("shortName", product.shortName);
  setAllText("price", formatMAD(product.priceMAD));
  setAllText("compare", formatMAD(product.compareAtMAD));
  setAllText("offer", product.offerLabel);
  setAllText("hours", STORE.supportHours);
  setAllText("stockText", getStockLabel(product.stock));
  renderHeroImage(product);
  renderGallery(product);

  qsa("[data-stock-badge]").forEach((el)=>{
    el.className = getStockClass(product.stock);
    el.textContent = getStockLabel(product.stock);
  });

  qsa('[data-action="open-order"]').forEach((btn) => {
    const isOut = product.stock <= 0;
    if(isOut){
      btn.textContent = "Rupture de stock";
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-secondary");
    }
    if("disabled" in btn) btn.disabled = isOut;
  });
}

function fillProductSelect(){
  const select = qs("#orderProduct");
  if(!select) return;
  select.innerHTML = STORE.products
    .map((p) => `<option value="${p.id}" ${p.stock <= 0 ? "disabled" : ""}>${p.shortName} - ${formatMAD(p.priceMAD)}</option>`)
    .join("");
  const current = getCurrentProduct();
  select.value = current.id;
}

function updateOrderQtyOptions(product){
  const select = qs("#orderQty");
  if(!select || !product) return;
  const max = Math.max(1, Math.min(10, Number(product.stock || 1)));
  const options = [];
  for(let i = 1; i <= max; i += 1){
    options.push(`<option value="${i}">${i}</option>`);
  }
  select.innerHTML = options.join("");
}

function openModal(){
  const modal = qs("#orderModal");
  if(!modal) return;
  modal.setAttribute("aria-hidden", "false");
  const first = qs("#orderName");
  first?.focus();
}

function closeModal(){
  const modal = qs("#orderModal");
  if(!modal) return;
  modal.setAttribute("aria-hidden", "true");
}

function initBindings(){
  loadStoreState();
  const product = getCurrentProduct();
  fillProductSelect();
  updatePageForProduct(product);
  renderProductList();
  updateOrderQtyOptions(product);

  // Buttons that open modal
  qsa('[data-action="open-order"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const selected = qs("#orderProduct");
      const p = selected ? getProductById(selected.value) : getCurrentProduct();
      if(p.stock <= 0){
        alert("Ce produit est en rupture de stock.");
        return;
      }
      openModal();
    });
  });

  qs("#orderProduct")?.addEventListener("change", (e)=>{
    const selectedProduct = getProductById(e.target.value);
    updateOrderQtyOptions(selectedProduct);
  });

  // Modal close
  qs('[data-action="close-order"]')?.addEventListener("click", (e)=>{ e.preventDefault(); closeModal(); });
  qs("#orderModal")?.addEventListener("click", (e)=>{
    if(e.target?.id === "orderModal") closeModal();
  });
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") closeModal();
  });

  // Submit
  qs("#orderForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = (qs("#orderName")?.value || "").trim();
    const phone = (qs("#orderPhone")?.value || "").trim();
    const city = (qs("#orderCity")?.value || "").trim();
    const address = (qs("#orderAddress")?.value || "").trim();
    const selectedProductId = qs("#orderProduct")?.value || getCurrentProduct().id;
    const product = getProductById(selectedProductId);
    const qty = Number(qs("#orderQty")?.value || 1) || 1;
    const note = (qs("#orderNote")?.value || "").trim();

    if(!name || !phone || !city || !address){
      alert("Merci de remplir Nom, Téléphone, Ville et Adresse.");
      return;
    }
    if(product.stock <= 0){
      alert("Ce produit est en rupture de stock.");
      return;
    }
    if(qty > product.stock){
      alert(`Quantite indisponible. Stock actuel: ${product.stock}`);
      return;
    }

    const msg = buildOrderMessage({product, name, phone, city, address, qty, note});
    window.open(waLink(msg), "_blank", "noopener,noreferrer");
  });
}

function initAdmin(){
  const loginForm = qs("#loginForm");
  const loginSection = qs("#loginSection");
  const adminApp = qs("#adminApp");
  if(!loginForm || !adminApp) return false;

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = qs("#passwordInput").value;
    if (password === "admin2026") {
      loginSection.style.display = "none";
      adminApp.style.display = "block";

      // initialize admin
      loadStoreState();
      const form = qs("#adminForm");
      const list = qs("#adminProductList");
      const rawExport = qs("#rawExport");
      const waInput = qs("#adminWhatsapp");
      const hoursInput = qs("#adminHours");

      function resetForm(){
        form.reset();
        qs("#adminId").value = "";
        qs("#pFeatured").checked = false;
        qs("#saveBtn").textContent = "Ajouter produit";
      }

      function fillForm(product){
        qs("#adminId").value = product.id;
        qs("#pId").value = product.id;
        qs("#pName").value = product.name;
        qs("#pShortName").value = product.shortName;
        qs("#pPrice").value = product.priceMAD;
        qs("#pCompare").value = product.compareAtMAD;
        qs("#pOffer").value = product.offerLabel;
        qs("#pStock").value = product.stock;
        qs("#pDescription").value = product.description;
        qs("#pImages").value = (product.images || []).join("\n");
        qs("#pFeatured").checked = product.featured;
        qs("#saveBtn").textContent = "Mettre a jour";
      }

      function renderAdminList(){
        list.innerHTML = "";
        STORE.products.forEach((p) => {
          const item = document.createElement("article");
          item.className = "card white product-card";
          item.innerHTML = `
            <img class="product-cover" src="${p.images?.[0] || ""}" alt="${p.shortName}" />
            <h3>${p.shortName}</h3>
            <p>ID: <code>${p.id}</code></p>
            <p>Prix: ${formatMAD(p.priceMAD)} | Stock: ${p.stock}</p>
            <div class="badge-line">
              <span class="${getStockClass(p.stock)}">${getStockLabel(p.stock)}</span>
              ${p.featured ? '<span class="badge green">Produit principal</span>' : ""}
            </div>
            <div class="cta-row">
              <button class="btn btn-secondary" data-edit="${p.id}">Modifier</button>
              <button class="btn btn-secondary" data-delete="${p.id}">Supprimer</button>
              <a class="btn btn-primary" href="produit.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">Voir page</a>
            </div>
          `;
          list.appendChild(item);
        });
        rawExport.value = JSON.stringify(STORE, null, 2);
      }

      function enforceFeatured(id){
        if(!id) return;
        STORE.products = STORE.products.map((p) => ({...p, featured: p.id === id}));
      }

      function upsertProduct(data){
        const idx = STORE.products.findIndex((p) => p.id === data.id);
        if(idx >= 0){
          STORE.products[idx] = data;
        }else{
          STORE.products.push(data);
        }
      }

      function deleteProduct(id){
        STORE.products = STORE.products.filter((p) => p.id !== id);
        if(!STORE.products.some((p)=>p.featured) && STORE.products[0]){
          STORE.products[0].featured = true;
        }
      }

      waInput.value = STORE.whatsappNumber;
      hoursInput.value = STORE.supportHours;
      renderAdminList();

      qs("#saveSettingsBtn").addEventListener("click", ()=>{
        STORE.whatsappNumber = waInput.value.trim();
        STORE.supportHours = hoursInput.value.trim();
        saveStoreState();
        alert("Parametres enregistres.");
      });

      form.addEventListener("submit", (e)=>{
        e.preventDefault();
        const id = qs("#pId").value.trim();
        if(!id){
          alert("ID obligatoire");
          return;
        }
        const product = {
          id,
          name: qs("#pName").value.trim(),
          shortName: qs("#pShortName").value.trim(),
          priceMAD: Number(qs("#pPrice").value || 0),
          compareAtMAD: Number(qs("#pCompare").value || 0),
          offerLabel: qs("#pOffer").value.trim(),
          stock: Number(qs("#pStock").value || 0),
          featured: qs("#pFeatured").checked,
          description: qs("#pDescription").value.trim(),
          images: qs("#pImages").value.split("\n").map((s)=>s.trim()).filter(Boolean),
        };
        if(!product.name || !product.shortName){
          alert("Nom complet et nom court obligatoires");
          return;
        }
        upsertProduct(product);
        if(product.featured) enforceFeatured(product.id);
        saveStoreState();
        renderAdminList();
        resetForm();
      });

      list.addEventListener("click", (e)=>{
        const editId = e.target.getAttribute("data-edit");
        const deleteId = e.target.getAttribute("data-delete");
        if(editId){
          const product = getProductById(editId);
          fillForm(product);
          window.scrollTo({top: 0, behavior: "smooth"});
          return;
        }
        if(deleteId){
          if(!confirm("Supprimer ce produit ?")) return;
          deleteProduct(deleteId);
          saveStoreState();
          renderAdminList();
        }
      });

      qs("#resetBtn").addEventListener("click", (e)=>{
        e.preventDefault();
        resetForm();
      });

      qs("#restoreDefaultsBtn").addEventListener("click", ()=>{
        if(!confirm("Restaurer les produits par defaut ?")) return;
        localStorage.removeItem(STORE_KEY);
        STORE.whatsappNumber = DEFAULT_STORE.whatsappNumber;
        STORE.supportHours = DEFAULT_STORE.supportHours;
        STORE.products = deepClone(DEFAULT_STORE.products);
        saveStoreState();
        location.reload();
      });

    } else {
      alert("Mot de passe incorrect.");
    }
  });

  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  const isAdmin = initAdmin();
  if(!isAdmin) initBindings();
});
