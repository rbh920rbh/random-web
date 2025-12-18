// 随机抽取工具主脚本

class RandomTool {
    constructor() {
        this.lists = this.loadLists();
        this.currentListId = this.loadCurrentListId();
        this.history = [];
        this.isDrawing = false;

        this.initElements();
        this.bindEvents();
        this.renderLists();
        if (this.currentListId && this.lists[this.currentListId]) {
            this.selectListById(this.currentListId);
        } else {
            this.updateUI();
        }
    }

    // 初始化DOM元素
    initElements() {
        this.listSelect = document.getElementById('listSelect');
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

    loadHistory() {
        const history = localStorage.getItem('randomTool_history');
        this.history = history ? JSON.parse(history) : [];
    }

    saveHistory() {
        localStorage.setItem('randomTool_history', JSON.stringify(this.history));
    }

    // 列表管理
    createNewList() {
        const listName = prompt('请输入新列表名称：');
        if (!listName || listName.trim() === '') return;

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

        delete this.lists[this.currentListId];
        this.saveLists();
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
        this.loadHistory();
        this.renderHistory();
    }

    renderLists() {
        this.listSelect.innerHTML = '<option value="">选择列表...</option>';

        Object.keys(this.lists).forEach(listId => {
            const option = document.createElement('option');
            option.value = listId;
            option.textContent = this.lists[listId].name;
            this.listSelect.appendChild(option);
        });
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
        let weightedItems = this.calculateWeightedItems(items);

        // 直接确定最终结果并显示弹窗
        setTimeout(() => {
            const result = this.selectRandomItem(weightedItems);
            this.showResultModal(result);
            this.addToHistory(result);
            this.isDrawing = false;
        }, 200);
    }

    // 显示结果弹窗
    showResultModal(result) {
        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'result-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎉 抽取结果 🎉</h3>
                </div>
                <div class="modal-body">
                    <div class="result-text">${this.escapeHtml(result.text)}</div>
                    <div class="result-weight">权重: ${result.weight}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary modal-close-btn">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // 绑定关闭事件
        const closeBtn = modal.querySelector('.modal-close-btn');
        const overlay = modal.querySelector('.modal-overlay');

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        // ESC键关闭
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });

        // 恢复按钮状态
        this.drawBtn.textContent = '再次抽取';
        this.drawBtn.disabled = false;
        this.drawBtn.classList.remove('drawing');
    }

    calculateWeightedItems(items) {
        const settings = this.loadSettings();
        let weightedItems = [...items];

        if (settings.weightReduction && this.history.length > 0) {
            // 应用权重递减
            weightedItems = weightedItems.map(item => {
                let adjustedWeight = item.weight;
                const lastIndex = this.history.findIndex(h => h.itemId === item.id);

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

    // 历史记录
    addToHistory(item) {
        this.history.unshift({
            itemId: item.id,
            text: item.text,
            timestamp: Date.now()
        });

        // 只保留最近3次
        if (this.history.length > 3) {
            this.history = this.history.slice(0, 3);
        }

        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        this.historyList.innerHTML = '';

        if (this.history.length === 0) {
            this.historyList.innerHTML = '<div class="history-item">暂无历史记录</div>';
            return;
        }

        this.history.forEach((record, index) => {
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
    }

    // 数据导入导出
    exportData() {
        const data = {
            lists: this.lists,
            settings: this.loadSettings(),
            currentListId: this.currentListId,
            history: this.history,
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

                if (data.history && Array.isArray(data.history)) {
                    this.history = data.history;
                    this.saveHistory();
                }

                // 重新初始化界面
                this.renderLists();
                if (this.currentListId && this.lists[this.currentListId]) {
                    this.selectListById(this.currentListId);
                } else {
                    this.updateUI();
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
