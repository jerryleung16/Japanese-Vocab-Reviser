// 日語詞彙資料庫 - 原始數據（已清空，等待用戶添加）
const originalVocabData = [
    // 這裡原本有你提供的範例詞彙，現在已清空
    // 用戶可以通過管理界面添加自己的詞彙
    // 格式：
    // {
    //     id: 1,
    //     hiragana: "平假名",
    //     kanji: "漢字",
    //     definition: "解釋",
    //     example: "例句",
    //     translation: "例句翻譯"
    // }
];

// 本地儲存相關功能
class VocabStorage {
    constructor() {
        this.originalData = originalVocabData;
        this.storageKey = 'japanese_custom_vocab';
        this.reviewStateKey = 'japanese_vocab_review_states';
        this.nextId = this.getNextId();
    }
    
    // 獲取下一個ID
    getNextId() {
        const customVocab = this.getCustomVocab();
        if (customVocab.length === 0) return 1000; // 自定義詞彙從1000開始
        const maxId = Math.max(...customVocab.map(item => item.id));
        return maxId + 1;
    }
    
    // 獲取自定義詞彙
    getCustomVocab() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('讀取自定義詞彙失敗:', error);
            return [];
        }
    }
    
    // 保存自定義詞彙
    saveCustomVocab(vocabList) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(vocabList));
            this.nextId = this.getNextId();
            return true;
        } catch (error) {
            console.error('保存自定義詞彙失敗:', error);
            return false;
        }
    }
    
    // 添加自定義詞彙
    addVocab(vocab) {
        const customVocab = this.getCustomVocab();
        
        // 檢查是否已存在
        const exists = customVocab.some(item => 
            item.hiragana === vocab.hiragana && 
            item.kanji === vocab.kanji
        );
        
        if (exists) {
            return {
                success: false,
                message: '詞彙已存在！'
            };
        }
        
        const newVocab = {
            id: this.nextId++,
            hiragana: vocab.hiragana,
            kanji: vocab.kanji || vocab.hiragana,
            definition: vocab.definition,
            example: vocab.example || '',
            translation: vocab.translation || ''
        };
        
        customVocab.push(newVocab);
        const saved = this.saveCustomVocab(customVocab);
        
        return {
            success: saved,
            message: saved ? '添加成功！' : '保存失敗，請檢查瀏覽器設定',
            vocab: newVocab
        };
    }
    
    // 更新自定義詞彙
    updateVocab(id, vocab) {
        const customVocab = this.getCustomVocab();
        const index = customVocab.findIndex(item => item.id === id);
        
        if (index === -1) {
            return {
                success: false,
                message: '找不到要更新的詞彙'
            };
        }
        
        // 檢查是否與其他詞彙重複（排除自己）
        const duplicate = customVocab.some((item, i) => 
            i !== index &&
            item.hiragana === vocab.hiragana && 
            item.kanji === vocab.kanji
        );
        
        if (duplicate) {
            return {
                success: false,
                message: '詞彙已存在！'
            };
        }
        
        // 更新詞彙
        customVocab[index] = {
            id: id,
            hiragana: vocab.hiragana,
            kanji: vocab.kanji || vocab.hiragana,
            definition: vocab.definition,
            example: vocab.example || '',
            translation: vocab.translation || ''
        };
        
        const saved = this.saveCustomVocab(customVocab);
        
        return {
            success: saved,
            message: saved ? '更新成功！' : '保存失敗，請檢查瀏覽器設定'
        };
    }
    
    // 刪除自定義詞彙
    deleteVocab(id) {
        const customVocab = this.getCustomVocab();
        const index = customVocab.findIndex(item => item.id === id);
        
        if (index === -1) {
            return {
                success: false,
                message: '找不到要刪除的詞彙'
            };
        }
        
        // 從陣列中移除
        customVocab.splice(index, 1);
        const saved = this.saveCustomVocab(customVocab);

        if (saved) {
            const states = this.getReviewStates();
            delete states[id];
            this.saveReviewStates(states);
        }
        
        return {
            success: saved,
            message: saved ? '刪除成功！' : '刪除失敗，請檢查瀏覽器設定'
        };
    }
    
    // 獲取所有詞彙（原始 + 自定義）
    getAllVocab() {
        const customVocab = this.getCustomVocab();
        return [...this.originalData, ...customVocab];
    }
    
    // 根據ID獲取詞彙
    getVocabById(id) {
        const allVocab = this.getAllVocab();
        return allVocab.find(item => item.id === id);
    }

    // 讀取複習標記狀態
    getReviewStates() {
        try {
            const stored = localStorage.getItem(this.reviewStateKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('讀取複習標記失敗:', error);
            return {};
        }
    }

    // 保存複習標記狀態
    saveReviewStates(states) {
        try {
            localStorage.setItem(this.reviewStateKey, JSON.stringify(states));
            return true;
        } catch (error) {
            console.error('保存複習標記失敗:', error);
            return false;
        }
    }

    // 獲取詞彙的複習狀態
    getVocabStatus(id) {
        const states = this.getReviewStates();
        return states[id] || 'pending';
    }

    // 設定詞彙的複習狀態
    setVocabStatus(id, status) {
        const states = this.getReviewStates();

        if (!status || status === 'pending') {
            delete states[id];
        } else {
            states[id] = status;
        }

        return this.saveReviewStates(states);
    }

    // 重置所有複習標記
    resetVocabStatus() {
        localStorage.removeItem(this.reviewStateKey);
        return true;
    }

    // 取得要進行複習的詞彙列表（排除已標記為「我會了」的詞彙）
    getReviewVocab(vocabList = this.getAllVocab()) {
        const states = this.getReviewStates();
        return vocabList.filter(item => states[item.id] !== 'known');
    }

    // 取得複習標記數量統計
    getReviewStatusCounts(vocabList = this.getAllVocab()) {
        const states = this.getReviewStates();
        const counts = {
            known: 0,
            dontknow: 0,
            pending: 0,
            total: vocabList.length
        };

        vocabList.forEach(item => {
            const status = states[item.id] || 'pending';
            if (status === 'known') {
                counts.known++;
            } else if (status === 'dontknow') {
                counts.dontknow++;
            } else {
                counts.pending++;
            }
        });

        return counts;
    }
    
    // 刪除所有自定義詞彙
    clearCustomVocab() {
        localStorage.removeItem(this.storageKey);
        this.nextId = 1000;
        return true;
    }
    
    // 重置為原始數據（刪除自定義）
    resetToOriginal() {
        return this.clearCustomVocab();
    }
    
    // 獲取原始詞彙數量
    getOriginalCount() {
        return this.originalData.length;
    }
    
    // 獲取自定義詞彙數量
    getCustomCount() {
        return this.getCustomVocab().length;
    }
    
    // 獲取總詞彙數量
    getTotalCount() {
        return this.originalData.length + this.getCustomVocab().length;
    }
    
    // 批量添加詞彙
    batchAddVocab(vocabList) {
        const results = {
            success: 0,
            failed: 0,
            messages: []
        };
        
        vocabList.forEach(vocab => {
            const result = this.addVocab(vocab);
            if (result.success) {
                results.success++;
            } else {
                results.failed++;
                results.messages.push(result.message);
            }
        });
        
        return results;
    }

    // 匯出同步資料（自定義詞彙 + 複習標記）
    exportSyncPayload() {
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            customVocab: this.getCustomVocab(),
            reviewStates: this.getReviewStates()
        };
    }

    // 匯入同步資料（可選覆蓋或合併）
    importSyncPayload(payload, options = {}) {
        const overwrite = options.overwrite !== false;

        if (!payload || typeof payload !== 'object') {
            return {
                success: false,
                message: '同步資料格式錯誤'
            };
        }

        const incomingCustom = Array.isArray(payload.customVocab) ? payload.customVocab : [];
        const incomingStates = payload.reviewStates && typeof payload.reviewStates === 'object' ? payload.reviewStates : {};

        if (overwrite) {
            this.saveCustomVocab(incomingCustom);
            this.saveReviewStates(incomingStates);
        } else {
            const localCustom = this.getCustomVocab();
            const mergedById = new Map();

            localCustom.forEach(item => mergedById.set(item.id, item));
            incomingCustom.forEach(item => mergedById.set(item.id, item));

            const mergedCustom = Array.from(mergedById.values());
            const mergedStates = {
                ...this.getReviewStates(),
                ...incomingStates
            };

            this.saveCustomVocab(mergedCustom);
            this.saveReviewStates(mergedStates);
        }

        this.nextId = this.getNextId();

        return {
            success: true,
            message: '同步資料已匯入',
            total: this.getTotalCount(),
            custom: this.getCustomCount()
        };
    }
}

// 創建儲存實例
const vocabStorage = new VocabStorage();

// 初始化當前詞彙列表
let currentVocabList = vocabStorage.getAllVocab();

// 公開函數供其他腳本使用
window.vocabStorage = vocabStorage;
window.getAllVocabData = () => vocabStorage.getAllVocab();
window.getOriginalVocabCount = () => vocabStorage.getOriginalCount();
window.getCustomVocabCount = () => vocabStorage.getCustomCount();
window.getVocabById = (id) => vocabStorage.getVocabById(id);

// 添加詞彙
window.addCustomVocab = (vocab) => vocabStorage.addVocab(vocab);

// 更新詞彙
window.updateCustomVocab = (id, vocab) => vocabStorage.updateVocab(id, vocab);

// 刪除詞彙
window.deleteCustomVocab = (id) => {
    const result = vocabStorage.deleteVocab(id);
    if (result.success) {
        currentVocabList = vocabStorage.getAllVocab();
    }
    return result;
};

// 重置功能
window.resetCustomVocab = () => {
    vocabStorage.clearCustomVocab();
    currentVocabList = vocabStorage.getAllVocab();
    return true;
};

window.resetAllVocab = () => {
    vocabStorage.resetToOriginal();
    currentVocabList = vocabStorage.getAllVocab();
    return true;
};

// 複習狀態相關
window.setVocabStatus = (id, status) => vocabStorage.setVocabStatus(id, status);
window.getVocabStatus = (id) => vocabStorage.getVocabStatus(id);
window.resetVocabStatuses = () => vocabStorage.resetVocabStatus();
window.getReviewVocabList = () => vocabStorage.getReviewVocab();
window.getReviewStatusCounts = () => vocabStorage.getReviewStatusCounts();
window.exportSyncPayload = () => vocabStorage.exportSyncPayload();
window.importSyncPayload = (payload, options) => {
    const result = vocabStorage.importSyncPayload(payload, options);
    if (result.success) {
        currentVocabList = vocabStorage.getAllVocab();
    }
    return result;
};