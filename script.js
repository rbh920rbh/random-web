// 随机抽取工具主脚本

class RandomTool {
    constructor() {
        this.lists = this.loadLists();
        this.globalHistoryKey = '__global__';
        this.currentListId = this.loadCurrentListId();
        this.historyStore = this.loadHistoryStore();
        this.isDrawing = false;

        this.initElements();
        this.bindEvents();
        this.renderLists();
        if (this.currentListId && this.lists[this.currentListId]) {
            this.selectListById(this.currentListId);
        } else {
            this.updateUI();
            this.renderHistory();
        }
    }

    // 初始化DOM元素
    initElements() {
        this.listControls = document.querySelector('.list-controls');
        this.dataControls = document.querySelector('.data-controls');
        this.listSelect = document.getElementById('listSelect');
        this.emptyActions = document.getElementById('emptyActions');
        this.emptyNewListBtn = document.getElementById('emptyNewListBtn');
        this.emptyImportBtn = document.getElementById('emptyImportBtn');
        this.moreActionsBtn = document.getElementById('moreActionsBtn');
        this.actionsPanel = document.getElementById('actionsPanel');
        this.moreActionsBtn.setAttribute('aria-expanded', 'false');
        this.mainPanels = document.getElementById('mainPanels');
        this.container = document.querySelector('.container');
        this.newListBtn = document.getElementById('newListBtn');
        this.deleteListBtn = document.getElementById('deleteListBtn');
        this.currentListName = document.getElementById('currentListName');
        this.newItemInput = document.getElementById('newItemInput');
        this.newItemWeight = document.getElementById('newItemWeight');
        this.addItemBtn = document.getElementById('addItemBtn');
        this.itemsList = document.getElementById('itemsList');
        this.weightReductionToggle = document.getElementById('weightReductionToggle');
        this.drawBtn = document.getElementById('drawBtn');
        this.historyList = document.getElementById('historyList');
        this.exportDataBtn = document.getElementById('exportDataBtn');
        this.importDataBtn = document.getElementById('importDataBtn');
        this.importDataInput = document.getElementById('importDataInput');
    }

    // 绑定事件
    bindEvents() {
        this.moreActionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleActionsPanel();
        });
        document.addEventListener('click', (e) => {
            if (
                this.actionsPanel.classList.contains('show') &&
                !this.actionsPanel.contains(e.target) &&
                !this.moreActionsBtn.contains(e.target)
            ) {
                this.closeActionsPanel();
            }
        });
        this.emptyNewListBtn.addEventListener('click', () => this.createNewList());
        this.emptyImportBtn.addEventListener('click', () => this.triggerImport());
        this.newListBtn.addEventListener('click', () => this.createNewList());
        this.deleteListBtn.addEventListener('click', () => this.deleteCurrentList());
        this.listSelect.addEventListener('change', () => this.selectList());
        this.addItemBtn.addEventListener('click', () => this.addItem());
        this.newItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });
        this.drawBtn.addEventListener('click', () => this.drawRandom());
        this.weightReductionToggle.addEventListener('change', () => this.saveSettings());
        this.exportDataBtn.addEventListener('click', () => this.exportData());
        this.importDataBtn.addEventListener('click', () => this.triggerImport());
        this.importDataInput.addEventListener('change', (e) => this.importData(e));
    }

    // 数据持久化
    loadLists() {
        const data = localStorage.getItem('randomTool_lists');
        return data ? JSON.parse(data) : {};
    }

    saveLists() {
        localStorage.setItem('randomTool_lists', JSON.stringify(this.lists));
    }

    loadCurrentListId() {
        return localStorage.getItem('randomTool_currentListId') || null;
    }

    saveCurrentListId(listId) {
        if (listId) {
            localStorage.setItem('randomTool_currentListId', listId);
        } else {
            localStorage.removeItem('randomTool_currentListId');
        }
    }

    loadSettings() {
        const settings = localStorage.getItem('randomTool_settings');
        return settings ? JSON.parse(settings) : { weightReduction: false };
    }

    saveSettings() {
        const settings = {
            weightReduction: this.weightReductionToggle.checked
        };
        localStorage.setItem('randomTool_settings', JSON.stringify(settings));
    }

    loadHistoryStore() {
        const history = localStorage.getItem('randomTool_history');
        if (!history) return {};
        try {
            const parsed = JSON.parse(history);
            if (Array.isArray(parsed)) {
                return { [this.globalHistoryKey]: parsed };
            }
            return parsed || {};
        } catch (e) {
            console.warn('History parse error', e);
            return {};
        }
    }

    saveHistoryStore() {
        localStorage.setItem('randomTool_history', JSON.stringify(this.historyStore));
    }

    getCurrentHistory() {
        if (this.currentListId && this.lists[this.currentListId]) {
            if (!Array.isArray(this.historyStore[this.currentListId])) {
                this.historyStore[this.currentListId] = [];
            }
            return this.historyStore[this.currentListId];
        }
        if (!Array.isArray(this.historyStore[this.globalHistoryKey])) {
            this.historyStore[this.globalHistoryKey] = [];
        }
        return this.historyStore[this.globalHistoryKey];
    }

    // 列表管理
    createNewList() {
        const listName = prompt('请输入新列表名称：');
        if (!listName || listName.trim() === '') return;

        this.closeActionsPanel();
        const listId = Date.now().toString();
        this.lists[listId] = {
            name: listName.trim(),
            items: []
        };

        this.saveLists();
        this.renderLists();
        this.selectListById(listId);
    }

    deleteCurrentList() {
        if (!this.currentListId) return;

        if (!confirm(`确定要删除列表"${this.lists[this.currentListId].name}"吗？`)) return;

        this.closeActionsPanel();
        delete this.lists[this.currentListId];
        this.saveLists();
        delete this.historyStore[this.currentListId];
        this.saveHistoryStore();
        this.currentListId = null;
        this.saveCurrentListId(null);
        this.renderLists();
        this.updateUI();
    }

    selectList() {
        const listId = this.listSelect.value;
        this.selectListById(listId);
    }

    selectListById(listId) {
        this.currentListId = listId;
        this.saveCurrentListId(listId);
        this.listSelect.value = listId;
        this.updateUI();
        this.renderHistory();
    }

    renderLists() {
        this.listSelect.innerHTML = '';

        const listIds = Object.keys(this.lists);
        listIds.forEach(listId => {
            const option = document.createElement('option');
            option.value = listId;
            option.textContent = this.lists[listId].name;
            this.listSelect.appendChild(option);
        });

        const hasList = listIds.length > 0;
        this.listSelect.style.display = hasList ? 'block' : 'none';
        this.moreActionsBtn.style.display = hasList ? 'inline-flex' : 'none';
        this.emptyActions.style.display = hasList ? 'none' : 'flex';
        if (this.listControls) {
            this.listControls.style.display = hasList ? 'flex' : 'none';
        }
        if (this.dataControls) {
            this.dataControls.style.display = hasList ? 'block' : 'none';
        }
        this.listSelect.style.display = hasList ? 'block' : 'none';
        this.moreActionsBtn.style.display = hasList ? 'inline-flex' : 'none';
        this.emptyActions.style.display = hasList ? 'none' : 'flex';
        this.mainPanels.classList.toggle('hidden', !hasList);
        if (this.container) {
            this.container.classList.toggle('empty-state', !hasList);
        }

        if (!hasList) {
            this.closeActionsPanel();
            this.currentListId = null;
            this.saveCurrentListId(null);
            this.updateUI();
            this.renderHistory();
            return;
        }

        if (!this.currentListId || !this.lists[this.currentListId]) {
            this.selectListById(listIds[0]);
        } else {
            this.listSelect.value = this.currentListId;
        }
    }

    // 列表项管理
    addItem() {
        if (!this.currentListId) {
            alert('请先选择一个列表');
            return;
        }

        const itemText = this.newItemInput.value.trim();
        const itemWeight = parseInt(this.newItemWeight.value) || 1;

        if (!itemText) {
            alert('请输入项的内容');
            return;
        }

        const item = {
            id: Date.now().toString(),
            text: itemText,
            weight: itemWeight
        };

        this.lists[this.currentListId].items.push(item);
        this.saveLists();
        this.updateUI();

        // 清空输入
        this.newItemInput.value = '';
        this.newItemWeight.value = '1';
        this.newItemInput.focus();
    }

    removeItem(itemId) {
        if (!this.currentListId) return;

        this.lists[this.currentListId].items = this.lists[this.currentListId].items.filter(
            item => item.id !== itemId
        );
        this.saveLists();
        this.updateUI();
    }

    updateItemWeight(itemId, newWeight) {
        if (!this.currentListId) return;

        const item = this.lists[this.currentListId].items.find(item => item.id === itemId);
        if (item) {
            item.weight = Math.max(1, parseInt(newWeight) || 1);
            this.saveLists();
            this.updateUI();
        }
    }

    renderItems() {
        this.itemsList.innerHTML = '';

        if (!this.currentListId) {
            this.itemsList.innerHTML = '<div class="item">请先选择列表</div>';
            return;
        }

        const items = this.lists[this.currentListId].items;
        if (items.length === 0) {
            this.itemsList.innerHTML = '<div class="item">列表为空，请添加项</div>';
            return;
        }

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';

            itemElement.innerHTML = `
                <span class="item-text">${this.escapeHtml(item.text)}</span>
                <input type="number" class="item-weight" value="${item.weight}" min="1"
                       onchange="randomTool.updateItemWeight('${item.id}', this.value)">
                <div class="item-actions">
                    <button class="btn btn-danger btn-small" onclick="randomTool.removeItem('${item.id}')">删除</button>
                </div>
            `;

            this.itemsList.appendChild(itemElement);
        });
    }

    // 随机抽取逻辑
    drawRandom() {
        if (!this.currentListId || this.isDrawing) return;

        const items = this.lists[this.currentListId].items;
        if (items.length === 0) {
            alert('列表为空，无法抽取');
            return;
        }

        this.isDrawing = true;
        this.drawBtn.disabled = true;
        this.drawBtn.textContent = '抽取中...';
        this.drawBtn.classList.add('drawing');

        // 计算权重
        const weightedItems = this.calculateWeightedItems(items);

        // 显示iOS风格滚轮
        this.showWheelPicker(weightedItems);
    }

    // 显示滚轮抽取动画
    showWheelPicker(weightedItems) {
        const finalResult = this.selectRandomItem(weightedItems);

        const wheelContainer = document.createElement('div');
        wheelContainer.className = 'wheel-picker';
        wheelContainer.innerHTML = `
            <div class="wheel-overlay"></div>
            <div class="wheel-content">
                <div class="wheel-body">
                    <div class="wheel-track">
                        <div class="wheel-items"></div>
                    </div>
                </div>
                <div class="wheel-footer">
                    <button class="wheel-confirm" disabled>确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(wheelContainer);

        const wheelItems = wheelContainer.querySelector('.wheel-items');
        const confirmBtn = wheelContainer.querySelector('.wheel-confirm');
        const overlay = wheelContainer.querySelector('.wheel-overlay');

        const itemHeight = 50;
        const itemGap = 4;
        const targetHeight = 50; // 中心行视觉高度
        const rowHeight = targetHeight + itemGap;

        const repeatCount = 12; // 更多条目制造更长滚动
        const displayItems = [];
        for (let i = 0; i < repeatCount; i++) {
            weightedItems.forEach(item => displayItems.push(item));
        }

        displayItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'wheel-item';
            el.textContent = item.text;
            el.dataset.itemId = item.id;
            wheelItems.appendChild(el);
        });

        const baseLength = weightedItems.length;
        const finalIndex = weightedItems.findIndex(item => item.id === finalResult.id);
        const centerRepeat = Math.max(1, Math.floor(repeatCount / 2));
        const targetIndex = centerRepeat * baseLength + finalIndex;
        const extraLoops = 4; // 额外滚动圈数

        const closeWheel = () => {
            wheelContainer.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(wheelContainer)) {
                    document.body.removeChild(wheelContainer);
                }
            }, 200);
            this.drawBtn.textContent = '再次抽取';
            this.drawBtn.disabled = false;
            this.drawBtn.classList.remove('drawing');
            this.isDrawing = false;
        };

        let resultRecorded = false;
        const recordResult = () => {
            if (resultRecorded) return;
            this.addToHistory(finalResult);
            resultRecorded = true;
        };

        const confirmResult = () => {
            recordResult();
            closeWheel();
        };

        overlay.addEventListener('click', () => {
            recordResult();
            closeWheel();
        });
        confirmBtn.addEventListener('click', confirmResult);
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                recordResult();
                closeWheel();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        const containerHeight = 270;
        const centerOffset = containerHeight / 2 - targetHeight / 2;
        const loopDistance = rowHeight * baseLength * extraLoops;
        const targetPosition = -(targetIndex * rowHeight) + centerOffset;
        const startPosition = targetPosition + loopDistance;

        const baseSpan = rowHeight * baseLength;
        this.updateWheelDepth(
            wheelItems,
            startPosition,
            rowHeight,
            containerHeight,
            itemHeight,
            baseSpan
        );

        // 展示并开启动画
        requestAnimationFrame(() => wheelContainer.classList.add('show'));
        setTimeout(() => {
            const animationOptions = {
                startPosition,
                targetPosition,
                rowHeight,
                containerHeight,
                itemHeight,
                baseSpan
            };
            this.startWheelAnimation(wheelItems, animationOptions, () => {
                recordResult();
                confirmBtn.disabled = false;
                confirmBtn.focus();
            });
        }, 80);
    }

    // 滚轮动画
    startWheelAnimation(wheelItems, options, onComplete) {
        const { startPosition, targetPosition, rowHeight, containerHeight, itemHeight, baseSpan } = options;
        const distance = targetPosition - startPosition;

        let startTime = null;
        const duration = 750; // 更快的滚动，接近1秒总时长

        wheelItems.style.transition = 'none';
        wheelItems.style.transform = `translateY(${startPosition}px)`;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentPosition = startPosition + distance * ease;

            wheelItems.style.transform = `translateY(${currentPosition}px)`;
            this.updateWheelDepth(
                wheelItems,
                currentPosition,
                rowHeight,
                containerHeight,
                itemHeight,
                baseSpan
            );

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                wheelItems.style.transform = `translateY(${targetPosition}px)`;
                this.updateWheelDepth(
                    wheelItems,
                    targetPosition,
                    rowHeight,
                    containerHeight,
                    itemHeight,
                    baseSpan
                );
                setTimeout(() => {
                    wheelItems.style.transition = '';
                }, 50);
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animate);
    }

    updateWheelDepth(wheelItems, currentPosition, rowHeight, containerHeight, itemHeight, baseSpan) {
        const items = wheelItems.children;
        const center = containerHeight / 2;
        const maxDistance = containerHeight / 2;
        const span = baseSpan;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemTop = i * rowHeight + currentPosition;
            let itemCenter = itemTop + itemHeight / 2;

            if (span > 0) {
                let relative = itemCenter - center;
                relative = ((relative + span / 2) % span + span) % span - span / 2;
                itemCenter = center + relative;
            }

            const distance = Math.min(Math.abs(itemCenter - center), maxDistance);
            const ratio = distance / maxDistance;

            // 使用更陡峭的缓和曲线使靠近中心的项更大更亮
            const scale = 1 - Math.pow(ratio, 1.05) * 0.25; // 中心≈1.00，最远≈0.75
            const opacity = 1 - Math.pow(ratio, 1.05) * 0.7;
            const isCenter = ratio < 0.15;

            item.style.transform = `scale(${scale})`;
            item.style.opacity = opacity;
            item.classList.toggle('wheel-item-active', isCenter);
        }
    }

    calculateWeightedItems(items) {
        const settings = this.loadSettings();
        let weightedItems = [...items];

        const history = this.getCurrentHistory();

        if (settings.weightReduction && history.length > 0) {
            // 应用权重递减
            weightedItems = weightedItems.map(item => {
                let adjustedWeight = item.weight;
                const lastIndex = history.findIndex(h => h.itemId === item.id);

                if (lastIndex === 0) {
                    // 上次选中，权重减为1/3
                    adjustedWeight = Math.max(1, Math.floor(item.weight / 3));
                } else if (lastIndex === 1) {
                    // 再上次选中，权重减为2/3
                    adjustedWeight = Math.max(1, Math.floor(item.weight * 2 / 3));
                }

                return { ...item, adjustedWeight };
            });
        } else {
            // 没有权重递减，使用原始权重
            weightedItems = weightedItems.map(item => ({ ...item, adjustedWeight: item.weight }));
        }

        return weightedItems;
    }

    selectRandomItem(weightedItems) {
        const totalWeight = weightedItems.reduce((sum, item) => sum + item.adjustedWeight, 0);
        let random = Math.random() * totalWeight;

        for (const item of weightedItems) {
            random -= item.adjustedWeight;
            if (random <= 0) {
                return item;
            }
        }

        // 兜底返回第一个
        return weightedItems[0];
    }

    showResult(item) {
        // 不再需要这个方法，因为结果现在通过弹窗显示
        // 保留方法以防其他地方调用
    }

    toggleActionsPanel() {
        const isOpen = this.actionsPanel.classList.toggle('show');
        this.moreActionsBtn.setAttribute('aria-expanded', String(isOpen));
    }

    closeActionsPanel() {
        if (this.actionsPanel.classList.contains('show')) {
            this.actionsPanel.classList.remove('show');
            this.moreActionsBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // 历史记录
    addToHistory(item) {
        if (!this.currentListId) return;

        const history = this.getCurrentHistory();
        history.unshift({
            itemId: item.id,
            text: item.text,
            timestamp: Date.now()
        });

        // 只保留最近3次
        if (history.length > 3) {
            history.length = 3;
        }

        if (this.currentListId && this.lists[this.currentListId]) {
            this.historyStore[this.currentListId] = history;
        } else {
            this.historyStore[this.globalHistoryKey] = history;
        }
        this.saveHistoryStore();
        this.renderHistory();
    }

    renderHistory() {
        this.historyList.innerHTML = '';

        const history = this.getCurrentHistory();
        if (!history.length) {
            this.historyList.innerHTML = '<div class="history-item">暂无历史记录</div>';
            return;
        }

        history.forEach((record, index) => {
            const historyElement = document.createElement('div');
            historyElement.className = 'history-item';
            historyElement.textContent = `${index + 1}. ${record.text}`;
            this.historyList.appendChild(historyElement);
        });
    }

    // UI更新
    updateUI() {
        // 更新当前列表名称
        if (this.currentListId && this.lists[this.currentListId]) {
            this.currentListName.textContent = ` - ${this.lists[this.currentListId].name}`;
        } else {
            this.currentListName.textContent = '';
        }

        // 渲染列表项
        this.renderItems();

        // 更新按钮状态
        const hasList = this.currentListId && this.lists[this.currentListId];
        const hasItems = hasList && this.lists[this.currentListId].items.length > 0;

        this.deleteListBtn.disabled = !hasList;
        this.addItemBtn.disabled = !hasList;
        this.newItemInput.disabled = !hasList;
        this.newItemWeight.disabled = !hasList;
        this.drawBtn.disabled = !hasItems;

        // 加载设置
        const settings = this.loadSettings();
        this.weightReductionToggle.checked = settings.weightReduction;

        // 更新历史显示
        this.renderHistory();
    }

    // 数据导入导出
    exportData() {
        this.closeActionsPanel();
        const data = {
            lists: this.lists,
            settings: this.loadSettings(),
            currentListId: this.currentListId,
            history: this.historyStore,
            exportTime: new Date().toISOString(),
            version: "1.0"
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `random_tool_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(link.href);
    }

    triggerImport() {
        this.closeActionsPanel();
        this.importDataInput.click();
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // 验证数据格式
                if (!data.lists || typeof data.lists !== 'object') {
                    throw new Error('无效的数据格式：缺少lists字段');
                }

                // 导入数据
                this.lists = data.lists;
                this.saveLists();

                if (data.currentListId && this.lists[data.currentListId]) {
                    this.currentListId = data.currentListId;
                    this.saveCurrentListId(data.currentListId);
                }

                if (data.settings) {
                    localStorage.setItem('randomTool_settings', JSON.stringify(data.settings));
                }

                if (data.history && typeof data.history === 'object') {
                    this.historyStore = data.history;
                    this.saveHistoryStore();
                } else {
                    this.historyStore = {};
                    this.saveHistoryStore();
                }

                // 重新初始化界面
                this.renderLists();
                if (this.currentListId && this.lists[this.currentListId]) {
                    this.selectListById(this.currentListId);
                } else {
                    this.updateUI();
                    this.renderHistory();
                }

                alert('数据导入成功！');
            } catch (error) {
                alert('数据导入失败：' + error.message);
                console.error('Import error:', error);
            }
        };

        reader.readAsText(file);
        // 清空文件输入，以便下次可以选择相同文件
        event.target.value = '';
    }

    // 工具函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
const randomTool = new RandomTool();
