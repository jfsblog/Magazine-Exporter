
        let pagesData = [];
        let currentGlobalBgColor = '#D3C3A3';
        let currentUploadTarget = null;
        let masterText = {
            signature: 'Shengle Wang',
            title: '葉綠宿',
            sub1: 'TAICHUNG / XITUN',
            sub2: 'STROLLTIMES.COM',
            timesColor: '#f4f4f4'
        };

        const workspace = document.getElementById('workspace');
        const staticThumbsContainer = document.getElementById('static-thumbs-container');
        const sortableThumbsContainer = document.getElementById('sortable-thumbs-container');

        function init() {
            pagesData = [
                { id: generateId(), type: 'h-cover', layout: '1', images: [], hasText: true, pageType: 'horizontal-cover' },
                { id: generateId(), type: 'v-cover', layout: '1', images: [], hasText: true, pageType: 'vertical-cover' },
                { id: generateId(), cssClass: 'page-left', layout: '1', images: [], hasBorders: false, hasText: false, hasLogo: false },
                { id: generateId(), cssClass: 'page-right', layout: '1', images: [], hasBorders: false, hasText: false, hasSub: false }
            ];

            document.getElementById('global-bg-color').addEventListener('input', (e) => {
                currentGlobalBgColor = e.target.value;
                document.querySelectorAll('.page').forEach(p => p.style.backgroundColor = currentGlobalBgColor);
                refreshThumbnails();
            });

            new Sortable(sortableThumbsContainer, {
                animation: 150,
                ghostClass: 'bg-purple-900',
                onEnd: function (evt) { reorderPagesByThumbs(); }
            });

            workspace.addEventListener('click', (e) => {
                if (e.target.classList.contains('img-container') || e.target.classList.contains('placed-img')) {
                    const container = e.target.closest('.img-container');
                    const pageEl = container.closest('.page');
                    if (!pageEl) return;
                    
                    const pageId = pageEl.dataset.id;
                    const grid = pageEl.querySelector('.layout-grid');
                    const containers = Array.from(grid.querySelectorAll('.img-container'));
                    const idx = containers.indexOf(container);
                    
                    if (e.target.classList.contains('placed-img')) {
                        enterImageEditMode(e.target, pageId, idx);
                    } else {
                        currentUploadTarget = { pageId, idx, container };
                        document.getElementById('image-upload').click();
                    }
                }
            });

            renderWorkspace();
        }

        function reorderPagesByThumbs() {
            const newPagesData = [pagesData[0], pagesData[1]]; 
            const thumbGroups = sortableThumbsContainer.querySelectorAll('.thumb-group');
            
            thumbGroups.forEach(group => {
                const leftId = group.dataset.pageLeftId;
                const rightId = group.dataset.pageRightId;
                
                if (leftId) {
                    const p1 = pagesData.find(p => p.id === leftId);
                    if(p1) newPagesData.push(p1);
                }
                if (rightId) {
                    const p2 = pagesData.find(p => p.id === rightId);
                    if(p2) newPagesData.push(p2);
                }
            });
            
            pagesData = newPagesData;
            renderWorkspace();
        }

        function refreshThumbnails() {
            staticThumbsContainer.innerHTML = '';
            sortableThumbsContainer.innerHTML = '';

            const covers = pagesData.slice(0, 2);
            const standardPages = pagesData.slice(2);

            let hThumb = document.createElement('div');
            hThumb.className = 'thumb-group shrink-0';
            const hBox = document.createElement('div');
            hBox.className = 'thumb-box thumb-standard cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all';
            hBox.onclick = () => scrollToSpread(covers[0].id);
            hBox.innerHTML = `<div class="thumb-page" style="background-color: ${currentGlobalBgColor};"></div>`;
            hThumb.appendChild(hBox);
            hThumb.insertAdjacentHTML('beforeend', '<div class="text-[10px] text-gray-500 text-center mt-1">橫向封面</div>');
            staticThumbsContainer.appendChild(hThumb);

            let vThumb = document.createElement('div');
            vThumb.className = 'thumb-group shrink-0';
            const vBox = document.createElement('div');
            vBox.className = 'thumb-box thumb-v-cover cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all';
            vBox.onclick = () => scrollToSpread(covers[1].id);
            vBox.innerHTML = `<div class="thumb-page" style="background-color: ${currentGlobalBgColor};"></div>`;
            vThumb.appendChild(vBox);
            vThumb.insertAdjacentHTML('beforeend', '<div class="text-[10px] text-gray-500 text-center mt-1">直向封面</div>');
            staticThumbsContainer.appendChild(vThumb);

            let spreadIndex = 1;
            for (let i = 0; i < standardPages.length; i += 2) {
                const p1 = standardPages[i];
                const p2 = standardPages[i+1];
                
                const group = document.createElement('div');
                group.className = 'thumb-group draggable-thumb shrink-0 relative';
                group.dataset.pageLeftId = p1 ? p1.id : '';
                group.dataset.pageRightId = p2 ? p2.id : '';
                
                const sBox = document.createElement('div');
                sBox.className = 'thumb-box thumb-standard cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all';
                sBox.onclick = () => { if (p1) scrollToSpread(p1.id); };

                const isSpreadFull = p1 && p1.layout === 'spread-full';
                sBox.innerHTML = `
                    <div class="thumb-page" style="background-color: ${currentGlobalBgColor}; ${isSpreadFull ? 'width: 100%; flex: none;' : 'border-right: 1px solid rgba(255,255,255,0.2);'}"></div>
                    ${isSpreadFull ? '' : `<div class="thumb-page" style="background-color: ${currentGlobalBgColor};"></div>`}
                `;
                group.appendChild(sBox);
                
                const delBtn = document.createElement('button');
                delBtn.className = 'absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs hidden group-hover:block z-10 shadow-lg hover:bg-red-500';
                delBtn.innerHTML = '<i class="fas fa-times"></i>';
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteSpread([p1, p2].filter(p=>p));
                };
                group.appendChild(delBtn);

                group.insertAdjacentHTML('beforeend', `<div class="text-[10px] text-gray-500 text-center mt-1">跨頁 ${spreadIndex++}</div>`);
                sortableThumbsContainer.appendChild(group);
            }
        }

        function scrollToSpread(pageId) {
            const el = document.querySelector(`.page[data-id="${pageId}"]`);
            if (el) {
                const wrapper = el.closest('.spread-wrapper') || el;
                wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function deleteSpread(pagesToDelete) {
            const idsToDelete = pagesToDelete.map(p => p.id);
            pagesData = pagesData.filter(p => !idsToDelete.includes(p.id));
            renderWorkspace();
        }

        function addStandardSpread() {
            pagesData.push({ id: generateId(), cssClass: 'page-left', layout: '1', images: [], hasBorders: false, hasText: false, hasLogo: false });
            pagesData.push({ id: generateId(), cssClass: 'page-right', layout: '1', images: [], hasBorders: false, hasText: false, hasSub: false });
            renderWorkspace();
            setTimeout(() => {
                const mainArea = document.getElementById('main-scroll-area');
                mainArea.scrollTo({ top: mainArea.scrollHeight, behavior: 'smooth' });
            }, 100);
        }

        function renderWorkspace() {
            workspace.innerHTML = '';
            
            const hCoverWrapper = document.createElement('div');
            hCoverWrapper.className = 'spread-wrapper relative group';
            const hcControls = document.createElement('div');
            hcControls.className = 'flex items-center gap-1 bg-[#222] p-1 rounded-lg border border-gray-600 shadow-lg absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity z-40';
            hcControls.innerHTML = getControlButtonsHTML('h-cover');
            bindControls(hcControls, pagesData[0]);
            hCoverWrapper.appendChild(hcControls);
            hCoverWrapper.appendChild(buildPageElement(pagesData[0]));
            workspace.appendChild(hCoverWrapper);

            const vCoverWrapper = document.createElement('div');
            vCoverWrapper.className = 'v-cover-wrapper relative group';
            const vcControls = document.createElement('div');
            vcControls.className = 'flex items-center gap-1 bg-[#222] p-1 rounded-lg border border-gray-600 shadow-lg absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity z-40';
            vcControls.innerHTML = getControlButtonsHTML('v-cover');
            bindControls(vcControls, pagesData[1]);
            vCoverWrapper.appendChild(vcControls);
            vCoverWrapper.appendChild(buildPageElement(pagesData[1]));
            workspace.appendChild(vCoverWrapper);

            const standardPages = pagesData.slice(2);
            for (let i = 0; i < standardPages.length; i += 2) {
                const spreadTpl = document.getElementById('spread-template').content.cloneNode(true);
                const wrapper = spreadTpl.querySelector('.spread-wrapper');
                const spread = wrapper.querySelector('.spread');
                
                const pLeftData = standardPages[i];
                const pRightData = standardPages[i+1];

                // 🌟 新增判斷：左頁是否為跨頁滿版
                const isSpreadFull = pLeftData && pLeftData.layout === 'spread-full';

                const cLeft = wrapper.querySelector('.control-left');
                const cRight = wrapper.querySelector('.control-right');
                
                if (pLeftData) {
                    cLeft.innerHTML = getControlButtonsHTML('standard', 'left');
                    bindControls(cLeft, pLeftData);
                    const leftEl = buildPageElement(pLeftData);
                    if (isSpreadFull) leftEl.classList.add('spread-full');
                    spread.replaceChild(leftEl, spread.querySelector('.page-left'));
                } else {
                    cLeft.style.display = 'none';
                    spread.querySelector('.page-left').innerHTML = '';
                }

                if (pRightData) {
                    cRight.innerHTML = getControlButtonsHTML('standard', 'right');
                    bindControls(cRight, pRightData);
                    const rightEl = buildPageElement(pRightData);
                    if (isSpreadFull) {
                        rightEl.classList.add('spread-full-hidden');
                        cRight.style.display = 'none';
                    }
                    spread.replaceChild(rightEl, spread.querySelector('.page-right'));
                } else {
                    cRight.style.display = 'none';
                    spread.querySelector('.page-right').innerHTML = '';
                }

                workspace.appendChild(wrapper);
            }

            document.querySelectorAll('.page').forEach(p => p.style.backgroundColor = currentGlobalBgColor);
            refreshThumbnails();
        }

        function buildPageElement(pageData) {
            const el = document.createElement('div');
            el.className = `page ${pageData.cssClass || ''}`;
            if(pageData.pageType) el.classList.add(pageData.pageType);
            el.dataset.id = pageData.id;

            const grid = document.createElement('div');
            grid.className = 'layout-grid';
            
            let tplId = `tpl-layout-${pageData.layout}`;
            if (pageData.pageType === 'horizontal-cover' && pageData.layout === 'h2') tplId = 'tpl-cover-h-2';
            if (pageData.pageType === 'vertical-cover' && pageData.layout === '2') tplId = 'tpl-layout-2'; 
            if (pageData.layout === 'spread-full') tplId = 'tpl-layout-spread-full';
            
            grid.style.gridTemplateColumns = '1fr';
            grid.style.gridTemplateRows = '1fr';
            
            if (pageData.layout === 'h2' || pageData.layout === '4') {
                grid.style.gridTemplateColumns = '1fr 1fr';
            }
            if (pageData.layout === '2' || pageData.layout.startsWith('3') || pageData.layout === '4' || pageData.layout === 'h2' || (pageData.pageType==='vertical-cover' && pageData.layout==='2')) {
                grid.style.gridTemplateRows = '1fr 1fr';
            }

            const template = document.getElementById(tplId);
            if (template) grid.innerHTML = template.innerHTML;
            el.appendChild(grid);

            const containers = grid.querySelectorAll('.img-container');
            containers.forEach((container, idx) => {
                const imgInfo = pageData.images[idx];
                if (imgInfo && imgInfo.dataUrl) {
                    container.innerHTML = '';
                    const img = new Image();
                    img.className = 'placed-img';
                    img.src = imgInfo.dataUrl;
                    img.dataset.filename = imgInfo.filename;
                    img.dataset.scale = imgInfo.scale;
                    img.dataset.minScale = imgInfo.minScale || imgInfo.scale; 
                    img.dataset.x = imgInfo.x;
                    img.dataset.y = imgInfo.y;
                    
                    img.onload = () => { applyImgTransform(img); };
                    container.appendChild(img);

                    // 🌟 新增：若浮水印開啟，則畫出浮水印
                    if (imgInfo.watermark && imgInfo.watermark.show) {
                        const wm = document.createElement('div');
                        wm.className = 'img-watermark';
                        wm.innerText = 'Shengle';
                        wm.style.opacity = imgInfo.watermark.opacity;
                        wm.style.transform = `scale(${imgInfo.watermark.scale}) rotate(${imgInfo.watermark.rotation}deg)`;
                        container.appendChild(wm);
                    }
                }
            });

            applyPageDecorations(pageData, el);
            return el;
        }

        function applyPageDecorations(pageData, pageEl = null) {
            const el = pageEl || document.querySelector(`.page[data-id="${pageData.id}"]`);
            if (!el) return;

            const grid = el.querySelector('.layout-grid');
            if (pageData.hasBorders) {
                el.classList.add('with-borders');
                if (grid) grid.querySelectorAll('.tpl-inner-grid, .tpl-sub-grid').forEach(ig => ig.style.gap = '40px');
            } else {
                el.classList.remove('with-borders');
                if (grid) grid.querySelectorAll('.tpl-inner-grid, .tpl-sub-grid').forEach(ig => ig.style.gap = '0px');
            }

            const existingHCText = el.querySelector('.h-cover-custom-text');
            const existingArtText = el.querySelector('.art-text-block');
            
            if (pageData.hasText) {
                if (pageData.pageType === 'horizontal-cover') {
                    if (!existingHCText) el.appendChild(createHCoverText());
                } else {
                    if (!existingArtText) el.appendChild(createTextBlock(pageData));
                }
            } else {
                if (existingHCText) existingHCText.remove();
                if (existingArtText) existingArtText.remove();
            }

            const existingLogo = el.querySelector('.decorator-logo');
            if (pageData.cssClass === 'page-left' && pageData.hasLogo) {
                if (!existingLogo) {
                    const logo = document.createElement('div');
                    logo.className = 'center-decorator decorator-logo';
                    logo.innerHTML = `<img src="logo.png" onerror="this.src='https://placehold.co/100x100/transparent/white?text=LOGO'" alt="Logo"><span>漫步時光</span>`;
                    el.appendChild(logo);
                }
            } else {
                if (existingLogo) existingLogo.remove();
            }

            const existingSub = el.querySelector('.decorator-sub');
            if (pageData.cssClass === 'page-right' && pageData.hasSub) {
                if (!existingSub) {
                    const sub = document.createElement('div');
                    sub.className = 'center-decorator decorator-sub';
                    sub.innerHTML = `<span>${masterText.sub1}<br>${masterText.sub2}</span>`;
                    el.appendChild(sub);
                }
            } else {
                if (existingSub) existingSub.remove();
            }
        }

        function getControlButtonsHTML(type, side = '') {
            if (type === 'h-cover') {
                return `
                    <button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="1" title="滿版"><i class="far fa-square"></i></button>
                    <button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="h2" title="左右併圖"><i class="fas fa-columns"></i></button>
                    <div class="w-px h-6 bg-gray-700 mx-1 mt-1"></div>
                    <button class="btn-toggle btn-text w-8 h-8 rounded text-white" title="主視覺文字"><i class="fas fa-font"></i></button>
                    <input type="color" class="btn-times-color w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0 ml-1" value="${masterText.timesColor}" title="更改 TIMES 文字顏色">
                `;
            } else if (type === 'v-cover') {
                return `
                    <button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="1" title="滿版"><i class="far fa-square"></i></button>
                    <button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="2" title="上下併圖"><i class="fas fa-grip-lines"></i></button>
                    <div class="w-px h-6 bg-gray-700 mx-1 mt-1"></div>
                    <button class="btn-toggle btn-text w-8 h-8 rounded text-white" title="主視覺文字"><i class="fas fa-font"></i></button>
                `;
            } else {
                return `
                    <button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="1"><i class="far fa-square"></i></button>
                    <button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="2"><i class="fas fa-grip-lines"></i></button>
                    <button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="3-top"><i class="fas fa-border-none"></i></button>
                    <button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="3-bottom"><i class="fas fa-border-all"></i></button>
                    <button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="4"><i class="fas fa-th-large"></i></button>
                    ${side === 'left' ? `<button class="btn-layout w-8 h-8 rounded text-gray-400 hover:bg-gray-700" data-layout="spread-full" title="跨頁滿版 (3:2)"><i class="fas fa-panorama"></i></button>` : ''}
                    <div class="w-px h-6 bg-gray-700 mx-1 mt-1"></div>
                    <button class="btn-toggle btn-border w-8 h-8 rounded text-gray-400 hover:bg-gray-700" title="邊框"><i class="fas fa-border-style"></i></button>
                    <button class="btn-toggle btn-text w-8 h-8 rounded text-gray-400 hover:bg-gray-700" title="文字"><i class="fas fa-font"></i></button>
                    ${side === 'left' ? `<button class="btn-toggle btn-logo w-8 h-8 rounded text-gray-400 hover:bg-gray-700" title="Logo"><i class="fas fa-leaf"></i></button>` : `<button class="btn-toggle btn-sub w-8 h-8 rounded text-gray-400 hover:bg-gray-700" title="飾字"><i class="fas fa-quote-right"></i></button>`}
                `;
            }
        }

        function bindControls(groupEl, pageData) {
            const layoutBtns = groupEl.querySelectorAll('.btn-layout');
            layoutBtns.forEach(btn => {
                if(btn.dataset.layout === pageData.layout) {
                    btn.classList.add('bg-gray-700', 'text-white');
                    btn.classList.remove('text-gray-400');
                }
                btn.onclick = () => {
                    pageData.layout = btn.dataset.layout;
                    renderWorkspace(); 
                };
            });

            const toggleBtn = (btnClass, propName, activeColor) => {
                const btn = groupEl.querySelector(btnClass);
                if (!btn) return;
                
                if(pageData[propName]) {
                    btn.classList.add(activeColor, 'text-white');
                    btn.classList.remove('text-gray-400', 'hover:bg-gray-700');
                }
                btn.onclick = () => {
                    pageData[propName] = !pageData[propName];
                    if (pageData[propName]) {
                        btn.classList.add(activeColor, 'text-white');
                        btn.classList.remove('text-gray-400', 'hover:bg-gray-700');
                    } else {
                        btn.classList.remove(activeColor, 'text-white');
                        btn.classList.add('text-gray-400', 'hover:bg-gray-700');
                    }
                    applyPageDecorations(pageData);
                };
            };

            toggleBtn('.btn-border', 'hasBorders', 'bg-blue-600');
            toggleBtn('.btn-text', 'hasText', 'bg-purple-600');
            toggleBtn('.btn-logo', 'hasLogo', 'bg-green-600');
            toggleBtn('.btn-sub', 'hasSub', 'bg-orange-600');

            const timesPicker = groupEl.querySelector('.btn-times-color');
            if (timesPicker) {
                timesPicker.addEventListener('input', (e) => {
                    masterText.timesColor = e.target.value;
                    document.querySelectorAll('.hc-times').forEach(el => el.style.color = masterText.timesColor);
                });
            }
        }

        function createHCoverText() {
            const hcText = document.createElement('div');
            hcText.className = 'h-cover-custom-text';
            hcText.innerHTML = `
                <div class="h-cover-top-banner">
                    <div class="h-cover-side-bar"></div>
                    <div class="h-cover-main-text">
                        <span>STROLL</span><span class="hc-times" style="color: ${masterText.timesColor}; transition: color 0.2s;">TIMES</span>
                    </div>
                    <div class="h-cover-side-bar"></div>
                </div>
                <div class="h-cover-bottom-text">
                    <div class="hc-title">${masterText.title}</div>
                    <div class="hc-sub1">${masterText.sub1}</div>
                    <div class="hc-sub2">${masterText.sub2}</div>
                </div>`;
            return hcText;
        }

        function createTextBlock(pageData) {
            if(!pageData.textSettings) {
                pageData.textSettings = { align: 'center', theme: 'white', top: '400px', left: '300px', transform: 'translate(-50%, -45%)' };
            }
            
            const block = document.createElement('div');
            block.className = `art-text-block align-${pageData.textSettings.align} theme-${pageData.textSettings.theme}`;
            block.style.top = pageData.textSettings.top;
            block.style.left = pageData.textSettings.left;
            block.style.transform = pageData.textSettings.transform;
            
            block.innerHTML = `
                <div class="text-toolbar" contenteditable="false">
                    <!-- 🌟 新增：專屬的十字拖曳手把 -->
                    <div class="tool-btn cursor-move text-drag-handle hover:text-white bg-gray-700/50" title="按住此處拖曳文字"><i class="fas fa-arrows-alt"></i></div>
                    <div class="w-px h-4 bg-gray-600 mx-1"></div>
                    
                    <button class="tool-btn hover:text-white" onclick="alignText(this, 'left')"><i class="fas fa-align-left"></i></button>
                    <button class="tool-btn hover:text-white" onclick="alignText(this, 'center')"><i class="fas fa-align-center"></i></button>
                    <button class="tool-btn hover:text-white" onclick="alignText(this, 'right')"><i class="fas fa-align-right"></i></button>
                    <div class="w-px h-4 bg-gray-600 mx-1"></div>
                    <div class="grid grid-cols-3 gap-1 px-1">
                        ${[1,2,3,4,5,6,7,8,9].map(i => `<button class="w-2 h-2 rounded-full bg-gray-500 hover:bg-white" onclick="posText(this, ${i})"></button>`).join('')}
                    </div>
                    <div class="w-px h-4 bg-gray-600 mx-1"></div>
                    <button class="tool-btn hover:text-white" onclick="themeText(this, 'black')"><i class="fas fa-circle text-black border border-white rounded-full text-xs"></i></button>
                    <button class="tool-btn hover:text-white" onclick="themeText(this, 'white')"><i class="fas fa-circle text-white border border-gray-500 rounded-full text-xs"></i></button>
                </div>
                <div class="text-signature" contenteditable="true" spellcheck="false" onblur="updateMasterText('signature', this.innerText)">${masterText.signature}</div>
                <div class="text-title" contenteditable="true" spellcheck="false" onblur="updateMasterText('title', this.innerText)">${masterText.title}</div>
                <div class="text-sub1" contenteditable="true" spellcheck="false" onblur="updateMasterText('sub1', this.innerText)">${masterText.sub1}</div>
                <div class="text-sub2" contenteditable="true" spellcheck="false" onblur="updateMasterText('sub2', this.innerText)">${masterText.sub2}</div>
            `;
            
            bindTextBlockEvents(block, pageData);
            return block;
        }

        let isDraggingText = false;
        let currentDragBlock = null;
        let currentDragPage = null;
        let textDragOffset = { x: 0, y: 0 };

        document.addEventListener('mousemove', (e) => {
            if (!isDraggingText || !currentDragBlock) return;
            const rect = currentDragPage.getBoundingClientRect();
            let newX = e.clientX - rect.left - textDragOffset.x;
            let newY = e.clientY - rect.top - textDragOffset.y;
            
            const blockRect = currentDragBlock.getBoundingClientRect();
            newX = Math.max(0, Math.min(newX, rect.width - blockRect.width));
            newY = Math.max(0, Math.min(newY, rect.height - blockRect.height));

            currentDragBlock.style.left = `${newX}px`;
            currentDragBlock.style.top = `${newY}px`;
            currentDragBlock.style.transform = 'none';
        });

        document.addEventListener('mouseup', () => {
            if (isDraggingText && currentDragBlock && currentDragPage) {
                const pageId = currentDragPage.dataset.id;
                const pData = pagesData.find(p => p.id === pageId);
                if (pData) {
                    pData.textSettings.top = currentDragBlock.style.top;
                    pData.textSettings.left = currentDragBlock.style.left;
                    pData.textSettings.transform = 'none';
                }
            }
            isDraggingText = false;
            currentDragBlock = null;
            currentDragPage = null;
        });

        function bindTextBlockEvents(block, pageData) {
            block.addEventListener('mousedown', (e) => {
                // 🌟 改良邏輯：判斷滑鼠點擊了什麼地方
                const isDragHandle = e.target.closest('.text-drag-handle');
                const isEditableText = e.target.tagName === 'DIV' && e.target.contentEditable === "true";
                const isOtherToolbarBtn = e.target.closest('.text-toolbar') && !isDragHandle;

                // 如果點擊的是文字(為了打字)，或是點到工具列上的其他按鈕，就不觸發拖曳
                if (isEditableText || isOtherToolbarBtn) return;

                isDraggingText = true;
                currentDragBlock = block;
                currentDragPage = block.closest('.page');
                
                const blockRect = block.getBoundingClientRect();
                textDragOffset.x = e.clientX - blockRect.left;
                textDragOffset.y = e.clientY - blockRect.top;
                
                if(block.style.transform.includes('translate')) {
                    block.style.left = `${blockRect.left - currentDragPage.getBoundingClientRect().left}px`;
                    block.style.top = `${blockRect.top - currentDragPage.getBoundingClientRect().top}px`;
                    block.style.transform = 'none';
                }
                e.preventDefault();
            });
        }

        function updateMasterText(key, value) {
            masterText[key] = value;
            document.querySelectorAll(`.text-${key}`).forEach(el => {
                if (el !== document.activeElement) el.innerText = value;
            });
            if(key === 'title') document.querySelectorAll('.hc-title').forEach(el => el.innerText = value);
            if(key === 'sub1') {
                document.querySelectorAll('.hc-sub1').forEach(el => el.innerText = value);
                syncDecorators();
            }
            if(key === 'sub2') {
                document.querySelectorAll('.hc-sub2').forEach(el => el.innerText = value);
                syncDecorators();
            }
        }
        
        function syncDecorators() {
            document.querySelectorAll('.decorator-sub').forEach(el => {
                el.innerHTML = `<span>${masterText.sub1}<br>${masterText.sub2}</span>`;
            });
        }

        function updateTextSetting(btn, key, val) {
            const block = btn.closest('.art-text-block');
            const pageId = block.closest('.page').dataset.id;
            const pData = pagesData.find(p => p.id === pageId);
            
            if (key === 'align') {
                block.classList.remove('align-left', 'align-center', 'align-right');
                block.classList.add(`align-${val}`);
            } else if (key === 'theme') {
                block.classList.remove('theme-white', 'theme-black');
                block.classList.add(`theme-${val}`);
            }
            pData.textSettings[key] = val;
        }

        window.alignText = (btn, align) => updateTextSetting(btn, 'align', align);
        window.themeText = (btn, theme) => updateTextSetting(btn, 'theme', theme);
        window.posText = (btn, pos) => {
            const block = btn.closest('.art-text-block');
            const pageEl = block.closest('.page');
            const pageId = pageEl.dataset.id;
            const pData = pagesData.find(p => p.id === pageId);
            
            // 🌟 新增判斷：確認目前這頁是不是被設定為跨頁滿版 (1200px 寬)
            const isSpreadFull = pData.layout === 'spread-full';
            
            // 如果是跨頁滿版，X軸基準點需要加倍 (原本置中是 300px，滿版置中是 600px)
            const centerL = isSpreadFull ? '600px' : '300px';
            const rightL  = isSpreadFull ? '1140px' : '540px';

            const positions = [
                // 上排 (靠上)
                {t:'60px', l:'60px', tx:'0', ty:'0'},      
                {t:'60px', l:centerL, tx:'-50%', ty:'0'},      
                {t:'60px', l:rightL, tx:'-100%', ty:'0'},
                
                // 中排 (垂直置中)
                {t:'400px', l:'60px', tx:'0', ty:'-45%'},  
                {t:'400px', l:centerL, tx:'-50%', ty:'-45%'},  
                {t:'400px', l:rightL, tx:'-100%', ty:'-45%'},
                
                // 下排 (靠下)
                {t:'740px', l:'60px', tx:'0', ty:'-100%'}, 
                {t:'740px', l:centerL, tx:'-50%', ty:'-100%'}, 
                {t:'740px', l:rightL, tx:'-100%', ty:'-100%'}
            ];
            const p = positions[pos-1];
            
            block.style.top = p.t; block.style.left = p.l; block.style.transform = `translate(${p.tx}, ${p.ty})`;
            pData.textSettings.top = p.t; pData.textSettings.left = p.l; pData.textSettings.transform = `translate(${p.tx}, ${p.ty})`;
        };

        document.getElementById('image-upload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file || !currentUploadTarget) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                const imgInfo = {
                    dataUrl: event.target.result,
                    filename: file.name,
                    scale: 1, x: 0, y: 0,
                    // 🌟 新增：上傳圖片時，初始化浮水印預設值 (預設關閉)
                    watermark: { show: false, opacity: 0.8, scale: 1, rotation: 0 }
                };
                
                const pData = pagesData.find(p => p.id === currentUploadTarget.pageId);
                pData.images[currentUploadTarget.idx] = imgInfo;
                
                const container = currentUploadTarget.container;
                container.innerHTML = '';
                
                const img = new Image();
                img.className = 'placed-img';
                img.src = imgInfo.dataUrl;
                img.dataset.filename = imgInfo.filename;
                
                img.onload = () => {
                    const cRect = container.getBoundingClientRect();
                    const minScale = Math.max(cRect.width / img.naturalWidth, cRect.height / img.naturalHeight);
                    imgInfo.minScale = minScale;
                    imgInfo.scale = minScale;
                    img.dataset.minScale = minScale;
                    img.dataset.scale = minScale;
                    img.dataset.x = 0; img.dataset.y = 0;
                    applyImgTransform(img);
                };
                container.appendChild(img);
            };
            reader.readAsDataURL(file);
            e.target.value = ''; 
        });

        let activeEditContainer = null;
        let activeImg = null;
        let imgTransform = { x: 0, y: 0, scale: 1 };
        let dragState = { isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 };
        let resizeState = { isResizing: false, startX: 0, startY: 0, initialScale: 1, dirX: 1, dirY: 1 };

        function enterImageEditMode(imgElement, pageId, idx) {
            if (activeEditContainer) exitImageEditMode();
            
            activeImg = imgElement;
            activeEditContainer = activeImg.closest('.img-container');
            
            imgTransform.x = parseFloat(activeImg.dataset.x || 0);
            imgTransform.y = parseFloat(activeImg.dataset.y || 0);
            imgTransform.scale = parseFloat(activeImg.dataset.scale || 1);
            
            const pData = pagesData.find(p => p.id === pageId);
            let wmSettings = pData.images[idx].watermark;
            if (!wmSettings) {
                // 預設左下角：距離左邊 20px，距離底部 20px（用像素）
                wmSettings = { show: false, opacity: 0.8, scale: 1, rotation: 0, x: 20, y: 20 };
                pData.images[idx].watermark = wmSettings;
            }
            // 如果舊專案仍是百分比，轉為像素（粗略轉換）
            if (wmSettings.x !== undefined && wmSettings.x < 1 && wmSettings.x > 0) {
                const rect = activeEditContainer?.getBoundingClientRect();
                if (rect) {
                    wmSettings.x = (wmSettings.x / 100) * rect.width;
                    wmSettings.y = (wmSettings.y / 100) * rect.height;
                } else {
                    wmSettings.x = 20;
                    wmSettings.y = 20;
                }
            }
            if (wmSettings.x === undefined) wmSettings.x = 20;
            if (wmSettings.y === undefined) wmSettings.y = 20;

            const overlay = document.createElement('div');
            overlay.className = 'img-edit-overlay';
            overlay.innerHTML = `
                <div class="resize-handle handle-tl"></div>
                <div class="resize-handle handle-tr"></div>
                <div class="resize-handle handle-bl"></div>
                <div class="resize-handle handle-br"></div>
                
                <!-- 🌟 移除了 shadow-lg 陰影 -->
                <div class="absolute top-4 left-1/2 -translate-x-1/2 flex items-center bg-[#222] p-1 rounded-lg border border-gray-600 pointer-events-auto z-50">
                    <button class="w-8 h-8 rounded text-gray-400 hover:bg-gray-700 flex items-center justify-center" onclick="replaceImg('${pageId}', ${idx}, event)" title="更換圖片">
                        <i class="fas fa-sync-alt"></i>
                    </button>

                    <div class="w-px h-6 bg-gray-700 mx-1"></div>

                    <button class="wm-toggle-btn w-8 h-8 rounded flex items-center justify-center ${wmSettings.show ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}" title="浮水印設定">
                        <i class="fas fa-signature"></i>
                    </button>

                    <div class="wm-tools flex items-center transition-all overflow-hidden ${wmSettings.show ? 'w-auto opacity-100 ml-1' : 'w-0 opacity-0 ml-0'}">
                        <!-- 🌟 新增：左中右三個下方的定位按鈕 -->
                        <div class="flex items-center gap-1 px-1 border-r border-gray-700 pr-2 mr-1">
                            <button class="w-5 h-5 rounded hover:bg-white hover:text-black text-gray-400 wm-pos-btn flex items-center justify-center text-[10px]" data-pos="left" title="左下"><i class="fas fa-align-left"></i></button>
                            <button class="w-5 h-5 rounded hover:bg-white hover:text-black text-gray-400 wm-pos-btn flex items-center justify-center text-[10px]" data-pos="center" title="中下"><i class="fas fa-align-center"></i></button>
                            <button class="w-5 h-5 rounded hover:bg-white hover:text-black text-gray-400 wm-pos-btn flex items-center justify-center text-[10px]" data-pos="right" title="右下"><i class="fas fa-align-right"></i></button>
                        </div>
                        
                        <div class="flex items-center gap-1 px-1" title="透明度">
                            <i class="fas fa-eye-dropper text-gray-400 text-[10px]"></i>
                            <input type="range" class="wm-opacity w-14 cursor-pointer" min="0.1" max="1" step="0.1" value="${wmSettings.opacity}">
                        </div>
                    </div>
                </div>
            `;
            activeEditContainer.appendChild(overlay);

            const updateWatermarkDOM = () => {
                let wm = activeEditContainer.querySelector('.img-watermark');
                if (wmSettings.show) {
                    if (!wm) {
                        wm = document.createElement('div');
                        wm.className = 'img-watermark';
                        wm.innerText = 'Shengle';
                        activeEditContainer.insertBefore(wm, overlay);
                        wm.addEventListener('mousedown', handleWmDragStart);
                    }
                    wm.style.opacity = wmSettings.opacity;
                    const containerRect = activeEditContainer.getBoundingClientRect();
                    const wmHeight = wm.offsetHeight || 40; // 若尚未渲染，用預估
                    wm.style.left = `${wmSettings.x}px`;
                    wm.style.bottom = `${wmSettings.y}px`;   // 改用 bottom，距離底部固定
                    wm.style.top = 'auto';
                    wm.style.transform = 'none';            // 不再需要 translate
                    wm.style.pointerEvents = 'auto';
                    wm.style.cursor = 'grab';
                    wm.style.textShadow = 'none';
                } else {
                    if (wm) {
                        wm.removeEventListener('mousedown', handleWmDragStart);
                        wm.remove();
                    }
                }

                const toggleBtn = overlay.querySelector('.wm-toggle-btn');
                const toolsDiv = overlay.querySelector('.wm-tools');
                if (wmSettings.show) {
                    toggleBtn.className = 'wm-toggle-btn w-8 h-8 rounded flex items-center justify-center bg-purple-600 text-white';
                    toolsDiv.className = 'wm-tools flex items-center transition-all overflow-hidden w-auto opacity-100 ml-1';
                } else {
                    toggleBtn.className = 'wm-toggle-btn w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:bg-gray-700';
                    toolsDiv.className = 'wm-tools flex items-center transition-all overflow-hidden w-0 opacity-0 ml-0';
                }
            };

            updateWatermarkDOM();

            overlay.querySelector('.wm-toggle-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                wmSettings.show = !wmSettings.show;
                updateWatermarkDOM();
            });
            overlay.querySelector('.wm-opacity').addEventListener('input', e => { wmSettings.opacity = e.target.value; updateWatermarkDOM(); });

            // 🌟 新增：處理下方三個位置的點擊事件
            overlay.querySelectorAll('.wm-pos-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const pos = btn.dataset.pos;
                    const containerRect = activeEditContainer.getBoundingClientRect();
                    
                    const wm = activeEditContainer.querySelector('.img-watermark');
                    const wmWidth = wm ? wm.getBoundingClientRect().width : 100;

                    wmSettings.y = 20;

                    if (pos === 'left') {
                        wmSettings.x = 20;
                    } else if (pos === 'center') {
                        wmSettings.x = (containerRect.width - wmWidth) / 2;
                    } else if (pos === 'right') {
                        wmSettings.x = containerRect.width - wmWidth - 20;
                    }
                    
                    updateWatermarkDOM();
                });
            });

            let isDraggingWm = false;
            let wmDragState = { startX: 0, startY: 0, initialX: 0, initialY: 0 };

            function handleWmDragStart(e) {
                e.stopPropagation();
                e.preventDefault();
                isDraggingWm = true;
                const wm = activeEditContainer.querySelector('.img-watermark');
                if (wm) wm.style.cursor = 'grabbing';
                
                const rect = activeEditContainer.getBoundingClientRect();
                // 記錄滑鼠起始位置 & 浮水印當前像素位置
                wmDragState.startX = e.clientX;
                wmDragState.startY = e.clientY;
                wmDragState.initialX = wmSettings.x;
                wmDragState.initialY = wmSettings.y;

                document.addEventListener('mousemove', handleWmDragMove);
                document.addEventListener('mouseup', handleWmDragEnd);
            }


            function handleWmDragMove(e) {
                if (!isDraggingWm) return;
                const rect = activeEditContainer.getBoundingClientRect();
                let dx = e.clientX - wmDragState.startX;
                let dy = e.clientY - wmDragState.startY;

                let newX = wmDragState.initialX + dx;
                let newY = wmDragState.initialY - dy;  // 方向修正

                const wm = activeEditContainer.querySelector('.img-watermark');
                const wmRect = wm ? wm.getBoundingClientRect() : null;
                const wmWidth = wmRect ? wmRect.width : 100;
                const wmHeight = wmRect ? wmRect.height : 40;
                const cw = rect.width;
                const ch = rect.height;

                newX = Math.max(0, Math.min(newX, cw - wmWidth));
                newY = Math.max(0, Math.min(newY, ch - wmHeight));

                wmSettings.x = newX;
                wmSettings.y = newY;
                updateWatermarkDOM();
            }

            function handleWmDragEnd() {
                isDraggingWm = false;
                const wm = activeEditContainer.querySelector('.img-watermark');
                if (wm) wm.style.cursor = 'grab';
                document.removeEventListener('mousemove', handleWmDragMove);
                document.removeEventListener('mouseup', handleWmDragEnd);
            }

            activeImg.addEventListener('mousedown', handleImgDragStart);
            activeEditContainer.addEventListener('wheel', handleImgWheel, { passive: false });
            overlay.querySelectorAll('.resize-handle').forEach(h => h.addEventListener('mousedown', handleImgResizeStart));
            
            document.addEventListener('mousedown', clickOutsideToExit);
        }

        window.replaceImg = function(pageId, idx, e) {
            e.stopPropagation();
            exitImageEditMode();
            const container = document.querySelector(`.page[data-id="${pageId}"] .layout-grid .img-container:nth-child(${idx+1})`);
            currentUploadTarget = { pageId, idx, container };
            document.getElementById('image-upload').click();
        }

        function exitImageEditMode() {
            if (activeEditContainer) {
                const overlay = activeEditContainer.querySelector('.img-edit-overlay');
                if (overlay) overlay.remove();
                
                activeImg.removeEventListener('mousedown', handleImgDragStart);
                activeEditContainer.removeEventListener('wheel', handleImgWheel);
                
                const pageEl = activeEditContainer.closest('.page');
                const containers = Array.from(pageEl.querySelector('.layout-grid').querySelectorAll('.img-container'));
                const idx = containers.indexOf(activeEditContainer);
                const pData = pagesData.find(p => p.id === pageEl.dataset.id);
                
                if (pData && pData.images[idx]) {
                    pData.images[idx].x = imgTransform.x;
                    pData.images[idx].y = imgTransform.y;
                    pData.images[idx].scale = imgTransform.scale;
                    activeImg.dataset.x = imgTransform.x;
                    activeImg.dataset.y = imgTransform.y;
                    activeImg.dataset.scale = imgTransform.scale;
                }
            }
            activeEditContainer = null; activeImg = null;
            document.removeEventListener('mousedown', clickOutsideToExit);
        }

        function clickOutsideToExit(e) {
            if (activeEditContainer && !activeEditContainer.contains(e.target)) exitImageEditMode();
        }

        function handleImgDragStart(e) {
            dragState = { isDragging: true, startX: e.clientX, startY: e.clientY, initialX: imgTransform.x, initialY: imgTransform.y };
            document.addEventListener('mousemove', handleImgDragMove);
            document.addEventListener('mouseup', handleImgDragEnd);
            e.preventDefault();
        }
        function handleImgDragMove(e) {
            if (!dragState.isDragging) return;
            imgTransform.x = dragState.initialX + (e.clientX - dragState.startX);
            imgTransform.y = dragState.initialY + (e.clientY - dragState.startY);
            enforceBounds();
        }
        function handleImgDragEnd() {
            dragState.isDragging = false;
            document.removeEventListener('mousemove', handleImgDragMove);
            document.removeEventListener('mouseup', handleImgDragEnd);
        }

        function handleImgResizeStart(e) {
            const isLeft = e.target.classList.contains('handle-tl') || e.target.classList.contains('handle-bl');
            const isTop = e.target.classList.contains('handle-tl') || e.target.classList.contains('handle-tr');
            
            resizeState = { 
                isResizing: true, 
                startX: e.clientX, 
                startY: e.clientY, 
                initialScale: imgTransform.scale,
                dirX: isLeft ? -1 : 1,
                dirY: isTop ? -1 : 1
            };
            document.addEventListener('mousemove', handleImgResizeMove);
            document.addEventListener('mouseup', handleImgResizeEnd);
            e.stopPropagation(); e.preventDefault();
        }
        function handleImgResizeMove(e) {
            if (!resizeState.isResizing) return;
            const dx = e.clientX - resizeState.startX;
            const dy = e.clientY - resizeState.startY;
            const delta = (dx * resizeState.dirX + dy * resizeState.dirY) * 0.003;
            
            imgTransform.scale = Math.max(parseFloat(activeImg.dataset.minScale), resizeState.initialScale + delta);
            enforceBounds();
        }
        function handleImgResizeEnd() {
            resizeState.isResizing = false;
            document.removeEventListener('mousemove', handleImgResizeMove);
            document.removeEventListener('mouseup', handleImgResizeEnd);
        }
        function handleImgWheel(e) {
            if (!activeEditContainer) return;
            const rect = activeEditContainer.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                e.preventDefault();
                const zoomDir = e.deltaY > 0 ? -1 : 1;
                imgTransform.scale = Math.max(parseFloat(activeImg.dataset.minScale), imgTransform.scale + (zoomDir * 0.05 * imgTransform.scale));
                enforceBounds();
            }
        }

        function enforceBounds() {
            if (!activeImg || !activeEditContainer) return;
            const cRect = activeEditContainer.getBoundingClientRect();
            const minScale = parseFloat(activeImg.dataset.minScale);
            
            imgTransform.scale = Math.max(imgTransform.scale, minScale);
            const scaledW = activeImg.naturalWidth * imgTransform.scale;
            const scaledH = activeImg.naturalHeight * imgTransform.scale;
            
            imgTransform.x = Math.min(0, Math.max(imgTransform.x, cRect.width - scaledW));
            imgTransform.y = Math.min(0, Math.max(imgTransform.y, cRect.height - scaledH));
            
            applyImgTransform(activeImg);
        }

        function applyImgTransform(img) {
            let x, y, scale;
            if (img === activeImg) {
                x = imgTransform.x !== undefined ? imgTransform.x : parseFloat(img.dataset.x || 0);
                y = imgTransform.y !== undefined ? imgTransform.y : parseFloat(img.dataset.y || 0);
                scale = imgTransform.scale !== undefined ? imgTransform.scale : parseFloat(img.dataset.scale || 1);
            } else {
                x = parseFloat(img.dataset.x || 0);
                y = parseFloat(img.dataset.y || 0);
                scale = parseFloat(img.dataset.scale || 1);
            }
            img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }

        function generateId() { return Math.random().toString(36).substr(2, 9); }

        
        // 供後台 Puppeteer 注入資料並重新渲染畫面的介面函式
        window.loadProjectState = function(state) {
            pagesData = state.pagesData;
            masterText = state.masterText;
            currentGlobalBgColor = state.globalBgColor;
            document.getElementById('global-bg-color').value = currentGlobalBgColor;
            renderWorkspace();
        };

        // 呼叫本地伺服器進行原生截圖的全新匯出函式
        async function exportProject() {
            const btn = document.getElementById('btn-export');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>正在進行原生渲染...';
            btn.disabled = true;

            // 匯出前先退出所有編輯狀態
            if (activeEditContainer) exitImageEditMode();
            document.querySelectorAll('[contenteditable="true"]').forEach(el => el.blur());

            // 準備要傳送給後台的當前畫面狀態資料
            const projectData = {
                globalBgColor: currentGlobalBgColor,
                masterText: masterText,
                pagesData: pagesData
            };

            try {
                const response = await fetch('/api/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(projectData)
                });

                if (!response.ok) throw new Error('伺服器截圖失敗');

                // 接收後台打好的 ZIP 檔並觸發下載
                const blob = await response.blob();
                saveAs(blob, "Magazine_Project.zip");
                alert('匯出成功！已自動下載高畫質 ZIP 壓縮檔。');
            } catch (err) {
                console.error("Export Error: ", err);
                alert("連線本地伺服器失敗！請確認您的 start.bat 與 server.js 有正常在背景執行。");
            } finally {
                btn.innerHTML = '<i class="fas fa-file-export mr-2"></i>匯出專案 (ZIP)';
                btn.disabled = false;
                renderWorkspace();
            }
        }

        // ================= 全新：專案匯入與還原邏輯 =================
        let pendingImportData = null;
        let selectedTxtFile = null;
        let selectedImageFiles = [];

        // 控制匯入面板的展開與收合
        function toggleImportPanel() {
            const panel = document.getElementById('import-panel');
            const chevron = document.getElementById('import-chevron');
            panel.classList.toggle('hidden');
            panel.classList.toggle('flex');
            chevron.classList.toggle('fa-chevron-down');
            chevron.classList.toggle('fa-chevron-up');
        }

        // 當使用者瀏覽並選取 TXT 檔案時，僅更新介面文字，不立刻執行
        function handleTxtSelect(e) {
            const file = e.target.files[0];
            if (file) {
                selectedTxtFile = file;
                document.getElementById('txt-filename').innerText = file.name;
                document.getElementById('txt-filename').title = file.name;
            }
        }

        // 當使用者瀏覽並選取圖片資料夾時，僅更新介面文字，不立刻執行
        function handleImgSelect(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                selectedImageFiles = files;
                // 讀取資料夾名稱並顯示檔案總數
                const folderName = files[0].webkitRelativePath.split('/')[0] || '已選取資料夾';
                document.getElementById('img-foldername').innerText = `${folderName} (${files.length}檔)`;
                document.getElementById('img-foldername').title = folderName;
            }
        }

        // 按下「開始匯入」按鈕時的聯合執行程序
        function executeImport() {
            if (!selectedTxtFile) {
                alert('請先瀏覽並選取「設定文件 (TXT)」！');
                return;
            }

            const btn = document.querySelector('button[onclick="executeImport()"]');
            const originalBtnHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>處理中...';
            btn.disabled = true;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    // 1. 載入骨架設定
                    pendingImportData = JSON.parse(evt.target.result);
                    currentGlobalBgColor = pendingImportData.globalBgColor || '#D3C3A3';
                    if (pendingImportData.masterText) masterText = pendingImportData.masterText;
                    document.getElementById('global-bg-color').value = currentGlobalBgColor;
                    
                    pagesData = pendingImportData.pages;
                    renderWorkspace(); // 畫出空圖的排版

                    // 2. 若有選取圖片資料夾，接著執行圖片掛載
                    if (selectedImageFiles.length > 0) {
                        processImportedImages(selectedImageFiles);
                    } else {
                        alert('✅ 排版骨架已載入！\n(因未選擇圖片路徑，故略過圖片還原步驟)');
                        resetImportUI(btn, originalBtnHtml);
                    }
                } catch(err) {
                    alert('檔案格式錯誤！請確保匯入的是 layout_settings.txt');
                    resetImportUI(btn, originalBtnHtml);
                }
            };
            reader.readAsText(selectedTxtFile);
        }

        function processImportedImages(files) {
            if (!pendingImportData) return;
            
            pagesData.forEach(page => {
                if (!page.images) return;
                page.images.forEach((imgInfo, idx) => {
                    if (imgInfo && imgInfo.filename) {
                        const matchedFile = files.find(f => f.name === imgInfo.filename);
                        if (matchedFile) {
                            const reader = new FileReader();
                            reader.onload = function(evt) {
                                page.images[idx].dataUrl = evt.target.result;
                                renderWorkspace(); // 重新渲染掛載好圖片的格子
                            };
                            reader.readAsDataURL(matchedFile);
                        }
                    }
                });
            });
            pendingImportData = null;
            
            setTimeout(() => {
                alert('🎉 專案與圖片已全數完美還原！');
                const btn = document.querySelector('button[onclick="executeImport()"]');
                resetImportUI(btn, '<i class="fas fa-play mr-2"></i>開始匯入');
            }, 500);
        }

        // 清空匯入面板狀態，以利下一次操作
        function resetImportUI(btn, btnHtml) {
            btn.innerHTML = btnHtml;
            btn.disabled = false;
            selectedTxtFile = null;
            selectedImageFiles = [];
            document.getElementById('import-file').value = '';
            document.getElementById('import-images').value = '';
            document.getElementById('txt-filename').innerText = '未選擇';
            document.getElementById('img-foldername').innerText = '未選擇';
            toggleImportPanel(); // 自動收合面板
        }

        window.onload = init;
    