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