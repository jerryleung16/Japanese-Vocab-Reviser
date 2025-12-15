// 等待網頁完全載入
document.addEventListener('DOMContentLoaded', function() {
    // 取得DOM元素
    const vocabCard = document.getElementById('vocabCard');
    const frontText = document.getElementById('frontText');
    const backKanji = document.getElementById('backKanji');
    const backReading = document.getElementById('backReading');
    const backDefinition = document.getElementById('backDefinition');
    const backExample = document.getElementById('backExample');
    const backTranslation = document.getElementById('backTranslation');
    const frontLabel = document.getElementById('frontLabel');
    const backLabel = document.getElementById('backLabel');
    
    const mode1Btn = document.getElementById('mode1');
    const mode2Btn = document.getElementById('mode2');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // 當前狀態
    let currentMode = 1; // 1: 平假名→漢字, 2: 漢字→平假名
    let currentIndex = 0;
    let isFlipped = false;
    
    // 更新詞彙列表函數
    function updateVocabList() {
        currentVocabList = window.vocabStorage.getAllVocab();
        currentIndex = Math.min(currentIndex, currentVocabList.length - 1);
        if (currentIndex < 0) currentIndex = 0;
        updateCard();
    }
    
    // 公開更新函數供管理面板使用
    window.updateCard = updateCard;
    window.updateVocabList = updateVocabList;
    
    // 初始化
    function init() {
        updateVocabList();
        
        // 設定事件監聽器
        vocabCard.addEventListener('click', flipCard);
        mode1Btn.addEventListener('click', () => switchMode(1));
        mode2Btn.addEventListener('click', () => switchMode(2));
        prevBtn.addEventListener('click', showPrevious);
        nextBtn.addEventListener('click', showNext);
        shuffleBtn.addEventListener('click', shuffleVocab);
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', handleKeyPress);
    }
    
    // 更新進度顯示
    function updateProgress() {
        if (currentVocabList.length === 0) {
            progressFill.style.width = '0%';
            progressText.textContent = '0/0';
            return;
        }
        
        const progress = ((currentIndex + 1) / currentVocabList.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${currentIndex + 1}/${currentVocabList.length}`;
    }
    
    // 更新卡片內容
    function updateCard() {
        if (currentVocabList.length === 0) {
            frontText.textContent = "無詞彙數據";
            backKanji.textContent = "請添加詞彙";
            backReading.textContent = "";
            backDefinition.textContent = "點擊「管理詞彙」按鈕添加你的第一個詞彙";
            backExample.textContent = "";
            backTranslation.textContent = "";
            updateProgress();
            return;
        }
        
        const currentVocab = currentVocabList[currentIndex];
        
        if (!currentVocab) return;
        
        // 重置卡片為正面
        vocabCard.classList.remove('flipped');
        isFlipped = false;
        
        if (currentMode === 1) {
            // 模式1: 正面顯示平假名，背面顯示漢字+解釋+例句
            frontLabel.textContent = "平假名";
            backLabel.textContent = "漢字+解釋";
            frontText.textContent = currentVocab.hiragana;
            backKanji.textContent = currentVocab.kanji;
            backReading.textContent = `読み方：${currentVocab.hiragana}`;
            backDefinition.innerHTML = currentVocab.definition;
            backExample.innerHTML = currentVocab.example;
            backTranslation.textContent = currentVocab.translation;
            
            // 標記自定義詞彙
            if (currentVocab.id >= 1000) {
                backReading.textContent += ' (自定義)';
            }
        } else {
            // 模式2: 正面顯示漢字，背面顯示平假名+解釋+例句
            frontLabel.textContent = "漢字";
            backLabel.textContent = "平假名+解釋";
            frontText.textContent = currentVocab.kanji;
            backKanji.textContent = currentVocab.hiragana;
            backReading.textContent = `漢字：${currentVocab.kanji}`;
            backDefinition.innerHTML = currentVocab.definition;
            backExample.innerHTML = currentVocab.example;
            backTranslation.textContent = currentVocab.translation;
            
            // 標記自定義詞彙
            if (currentVocab.id >= 1000) {
                backReading.textContent += ' (自定義)';
            }
        }
        
        updateProgress();
    }
    
    // 翻轉卡片
    function flipCard() {
        if (currentVocabList.length === 0) return;
        isFlipped = !isFlipped;
        vocabCard.classList.toggle('flipped');
    }
    
    // 切換模式
    function switchMode(mode) {
        if (currentMode === mode) return;
        
        currentMode = mode;
        
        // 更新按鈕狀態
        if (mode === 1) {
            mode1Btn.classList.add('active');
            mode2Btn.classList.remove('active');
        } else {
            mode1Btn.classList.remove('active');
            mode2Btn.classList.add('active');
        }
        
        // 更新卡片
        updateCard();
    }
    
    // 顯示上一個單字
    function showPrevious() {
        if (currentVocabList.length === 0) return;
        
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = currentVocabList.length - 1; // 循環到最後一個
        }
        updateCard();
    }
    
    // 顯示下一個單字
    function showNext() {
        if (currentVocabList.length === 0) return;
        
        if (currentIndex < currentVocabList.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // 循環到第一個
        }
        updateCard();
    }
    
    // 隨機排序詞彙
    function shuffleVocab() {
        if (currentVocabList.length === 0) return;
        
        // 隨機排序陣列 (Fisher-Yates 洗牌算法)
        for (let i = currentVocabList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentVocabList[i], currentVocabList[j]] = [currentVocabList[j], currentVocabList[i]];
        }
        
        // 回到第一個
        currentIndex = 0;
        updateCard();
        
        // 顯示提示
        showNotification('單字已隨機排序！');
    }
    
    // 處理鍵盤按鍵
    function handleKeyPress(event) {
        switch(event.key) {
            case 'ArrowLeft':
                showPrevious();
                break;
            case 'ArrowRight':
                showNext();
                break;
            case ' ':
            case 'Enter':
                flipCard();
                event.preventDefault(); // 防止空格鍵滾動頁面
                break;
            case '1':
                switchMode(1);
                break;
            case '2':
                switchMode(2);
                break;
            case 'r':
            case 'R':
                shuffleVocab();
                break;
            case 'Escape':
                // 關閉管理面板
                const managementPanel = document.getElementById('managementPanel');
                if (managementPanel) {
                    managementPanel.classList.remove('active');
                }
                // 關閉編輯對話框
                const editDialog = document.getElementById('editDialog');
                if (editDialog) {
                    editDialog.classList.remove('active');
                }
                // 關閉確認對話框
                const confirmDialog = document.getElementById('confirmDialog');
                if (confirmDialog) {
                    confirmDialog.classList.remove('active');
                }
                break;
        }
    }
    
    // 顯示通知訊息（與管理面板共用）
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        
        if (notification && notificationMessage) {
            notificationMessage.textContent = message;
            notification.className = 'notification';
            
            if (type === 'error') {
                notification.style.background = '#e74c3c';
            } else if (type === 'warning') {
                notification.style.background = '#f39c12';
            } else {
                notification.style.background = '#27ae60';
            }
            
            notification.classList.add('active');
            
            // 3秒後自動隱藏
            setTimeout(() => {
                notification.classList.remove('active');
            }, 3000);
        } else {
            // 如果通知元素不存在，使用alert
            alert(message);
        }
    }
    
    // 公開函數供管理面板使用
    window.showNotification = showNotification;
    
    // 開始應用
    init();
});

// 管理面板功能
document.addEventListener('DOMContentLoaded', function() {
    // 管理面板元素
    const manageBtn = document.getElementById('manageBtn');
    const exportBtn = document.getElementById('exportBtn');
    const editCurrentBtn = document.getElementById('editCurrentBtn');
    const managementPanel = document.getElementById('managementPanel');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 單個添加元素
    const hiraganaInput = document.getElementById('hiraganaInput');
    const kanjiInput = document.getElementById('kanjiInput');
    const definitionInput = document.getElementById('definitionInput');
    const exampleInput = document.getElementById('exampleInput');
    const translationInput = document.getElementById('translationInput');
    const addVocabBtn = document.getElementById('addVocabBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');
    
    // 批量導入元素
    const bulkInput = document.getElementById('bulkInput');
    const bulkPreview = document.getElementById('bulkPreview');
    const importBulkBtn = document.getElementById('importBulkBtn');
    const clearBulkBtn = document.getElementById('clearBulkBtn');
    
    // 管理元素
    const totalCountElem = document.getElementById('totalCount');
    const originalCountElem = document.getElementById('originalCount');
    const customCountElem = document.getElementById('customCount');
    const resetCustomBtn = document.getElementById('resetCustomBtn');
    const resetAllBtn = document.getElementById('resetAllBtn');
    
    // 編輯相關元素
    const editDialog = document.getElementById('editDialog');
    const closeEditBtn = document.getElementById('closeEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const deleteVocabBtn = document.getElementById('deleteVocabBtn');
    
    const editHiragana = document.getElementById('editHiragana');
    const editKanji = document.getElementById('editKanji');
    const editDefinition = document.getElementById('editDefinition');
    const editExample = document.getElementById('editExample');
    const editTranslation = document.getElementById('editTranslation');
    const editDialogTitle = document.getElementById('editDialogTitle');
    const editError = document.getElementById('editError');
    
    // 詞彙列表相關元素
    const listTab = document.getElementById('listTab');
    const vocabListBody = document.getElementById('vocabListBody');
    const searchInput = document.getElementById('searchInput');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // 確認對話框元素
    const confirmDialog = document.getElementById('confirmDialog');
    const dialogTitle = document.getElementById('dialogTitle');
    const dialogMessage = document.getElementById('dialogMessage');
    const dialogConfirmBtn = document.getElementById('dialogConfirmBtn');
    const dialogCancelBtn = document.getElementById('dialogCancelBtn');
    
    // 通知元素
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    
    // 分頁和篩選變量
    let currentPage = 1;
    let itemsPerPage = 10;
    let currentFilter = 'all';
    let currentSearch = '';
    
    // 當前操作類型
    let currentAction = '';
    
    // 當前正在編輯的詞彙ID
    let editingVocabId = null;
    
    // 切換管理面板顯示
    if (manageBtn) {
        manageBtn.addEventListener('click', function() {
            managementPanel.classList.toggle('active');
            updateStats();
        });
    }
    
    // 導出詞彙功能
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const allVocab = window.getAllVocabData();
            const exportData = JSON.stringify(allVocab, null, 2);
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'japanese_vocabulary_' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('詞彙已導出為JSON文件！');
        });
    }
    
    // 編輯當前顯示的詞彙
    if (editCurrentBtn) {
        editCurrentBtn.addEventListener('click', function() {
            const allVocab = window.vocabStorage.getAllVocab();
            if (allVocab.length === 0) {
                showNotification('沒有詞彙可以編輯！', 'error');
                return;
            }
            
            const currentVocab = allVocab[currentIndex];
            if (currentVocab) {
                openEditDialog(currentVocab.id);
            }
        });
    }
    
    // 標籤切換功能
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 更新標籤按鈕狀態
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 更新標籤內容
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId + 'Tab') {
                    content.classList.add('active');
                }
            });
            
            // 如果是批量導入標籤，更新預覽
            if (tabId === 'bulk') {
                updateBulkPreview();
            }
            
            // 如果是列表標籤，更新表格
            if (tabId === 'list') {
                currentPage = 1;
                updateVocabListTable();
            }
        });
    });
    
    // 清空表單
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', function() {
            hiraganaInput.value = '';
            kanjiInput.value = '';
            definitionInput.value = '';
            exampleInput.value = '';
            translationInput.value = '';
        });
    }
    
    // 添加單個詞彙
    if (addVocabBtn) {
        addVocabBtn.addEventListener('click', function() {
            const hiragana = hiraganaInput.value.trim();
            const kanji = kanjiInput.value.trim();
            const definition = definitionInput.value.trim();
            const example = exampleInput.value.trim();
            const translation = translationInput.value.trim();
            
            // 驗證輸入
            if (!hiragana || !definition) {
                showNotification('請至少填寫平假名和解釋！', 'error');
                return;
            }
            
            // 添加詞彙
            const result = window.addCustomVocab({
                hiragana: hiragana,
                kanji: kanji || hiragana,
                definition: definition,
                example: example,
                translation: translation
            });
            
            if (result.success) {
                // 清空表單
                clearFormBtn.click();
                
                // 更新卡片顯示
                if (window.updateCard) {
                    window.updateCard();
                }
                
                // 顯示成功訊息
                showNotification(`已添加詞彙：${kanji || hiragana}`);
                
                // 更新統計數據
                updateStats();
            } else {
                showNotification(result.message, 'error');
            }
        });
    }
    
    // 批量輸入實時預覽
    if (bulkInput) {
        bulkInput.addEventListener('input', updateBulkPreview);
    }
    
    // 清空批量輸入
    if (clearBulkBtn) {
        clearBulkBtn.addEventListener('click', function() {
            bulkInput.value = '';
            updateBulkPreview();
        });
    }
    
    // 導入批量詞彙
    if (importBulkBtn) {
        importBulkBtn.addEventListener('click', function() {
            const bulkText = bulkInput.value.trim();
            if (!bulkText) {
                showNotification('請輸入要導入的詞彙數據！', 'error');
                return;
            }
            
            const lines = bulkText.split('\n').filter(line => line.trim() !== '');
            const importedVocab = [];
            const errors = [];
            
            lines.forEach((line, index) => {
                const parts = line.split('|').map(part => part.trim());
                
                // 驗證格式
                if (parts.length < 3) {
                    errors.push(`第 ${index + 1} 行：格式不正確（需要至少3個欄位）`);
                    return;
                }
                
                const [hiragana, kanji, definition, example, translation] = parts;
                
                if (!hiragana || !definition) {
                    errors.push(`第 ${index + 1} 行：平假名和解釋不能為空`);
                    return;
                }
                
                importedVocab.push({
                    hiragana: hiragana,
                    kanji: kanji || hiragana,
                    definition: definition,
                    example: example || '',
                    translation: translation || ''
                });
            });
            
            if (errors.length > 0) {
                showNotification(`導入失敗：\n${errors.join('\n')}`, 'error');
                return;
            }
            
            if (importedVocab.length === 0) {
                showNotification('沒有找到有效的詞彙數據！', 'error');
                return;
            }
            
            // 批量添加詞彙
            importedVocab.forEach(vocab => {
                window.addCustomVocab(vocab);
            });
            
            // 清空輸入框
            bulkInput.value = '';
            updateBulkPreview();
            
            // 更新卡片顯示
            if (window.updateCard) {
                window.updateCard();
            }
            
            // 顯示成功訊息
            showNotification(`成功導入 ${importedVocab.length} 個詞彙！`);
            
            // 更新統計數據
            updateStats();
        });
    }
    
    // 刪除自定義詞彙
    if (resetCustomBtn) {
        resetCustomBtn.addEventListener('click', function() {
            currentAction = 'resetCustom';
            dialogTitle.textContent = '刪除自定義詞彙';
            dialogMessage.textContent = '你確定要刪除所有自定義詞彙嗎？這個操作無法撤銷。';
            confirmDialog.classList.add('active');
        });
    }
    
    // 重置所有詞彙
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', function() {
            currentAction = 'resetAll';
            dialogTitle.textContent = '重置為原始數據';
            dialogMessage.textContent = '你確定要重置所有詞彙嗎？所有自定義詞彙將會被刪除。';
            confirmDialog.classList.add('active');
        });
    }
    
    // 確認對話框操作
    if (dialogConfirmBtn) {
        dialogConfirmBtn.addEventListener('click', function() {
            if (currentAction === 'resetCustom') {
                // 刪除自定義詞彙
                if (window.resetCustomVocab) {
                    window.resetCustomVocab();
                    showNotification('已刪除所有自定義詞彙');
                }
            } else if (currentAction === 'resetAll') {
                // 重置所有詞彙
                if (window.resetAllVocab) {
                    window.resetAllVocab();
                    showNotification('已重置所有詞彙');
                }
            } else if (currentAction === 'deleteSingle') {
                // 刪除單個詞彙
                const result = window.vocabStorage.deleteVocab(editingVocabId);
                if (result.success) {
                    showNotification('詞彙已刪除！');
                    closeEditDialog();
                    
                    // 更新主頁面顯示
                    if (window.updateVocabList) {
                        window.updateVocabList();
                    }
                    
                    // 更新詞彙列表
                    updateVocabListTable();
                    updateStats();
                } else {
                    showNotification(result.message, 'error');
                }
            }
            
            confirmDialog.classList.remove('active');
        });
    }
    
    if (dialogCancelBtn) {
        dialogCancelBtn.addEventListener('click', function() {
            confirmDialog.classList.remove('active');
        });
    }
    
    // 打開編輯對話框
    function openEditDialog(vocabId) {
        const vocab = window.vocabStorage.getVocabById(vocabId);
        if (!vocab) {
            showNotification('找不到要編輯的詞彙！', 'error');
            return;
        }
        
        editingVocabId = vocabId;
        
        // 填充表單
        editHiragana.value = vocab.hiragana || '';
        editKanji.value = vocab.kanji || '';
        editDefinition.value = vocab.definition || '';
        editExample.value = vocab.example || '';
        editTranslation.value = vocab.translation || '';
        
        // 設置對話框標題
        editDialogTitle.textContent = `編輯詞彙: ${vocab.kanji || vocab.hiragana}`;
        
        // 如果是原始詞彙，禁用刪除按鈕
        if (vocab.id < 1000) {
            deleteVocabBtn.disabled = true;
            deleteVocabBtn.title = '原始詞彙不能刪除';
            deleteVocabBtn.style.opacity = '0.6';
        } else {
            deleteVocabBtn.disabled = false;
            deleteVocabBtn.title = '';
            deleteVocabBtn.style.opacity = '1';
        }
        
        // 顯示對話框
        editDialog.classList.add('active');
        editError.style.display = 'none';
        
        // 聚焦到第一個輸入框
        setTimeout(() => editHiragana.focus(), 100);
    }
    
    // 關閉編輯對話框
    function closeEditDialog() {
        editDialog.classList.remove('active');
        editingVocabId = null;
        editError.style.display = 'none';
    }
    
    // 關閉編輯對話框事件
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', closeEditDialog);
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditDialog);
    }
    
    // 保存編輯
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', function() {
            if (!editingVocabId) return;
            
            const hiragana = editHiragana.value.trim();
            const kanji = editKanji.value.trim();
            const definition = editDefinition.value.trim();
            const example = editExample.value.trim();
            const translation = editTranslation.value.trim();
            
            // 驗證輸入
            if (!hiragana || !definition) {
                editError.textContent = '請至少填寫平假名和解釋！';
                editError.style.display = 'block';
                return;
            }
            
            // 更新詞彙
            const result = window.vocabStorage.updateVocab(editingVocabId, {
                hiragana: hiragana,
                kanji: kanji || hiragana,
                definition: definition,
                example: example,
                translation: translation
            });
            
            if (result.success) {
                showNotification('詞彙已更新！');
                closeEditDialog();
                
                // 更新主頁面顯示
                if (window.updateVocabList) {
                    window.updateVocabList();
                }
                
                // 更新詞彙列表
                updateVocabListTable();
                updateStats();
            } else {
                editError.textContent = result.message;
                editError.style.display = 'block';
            }
        });
    }
    
    // 刪除詞彙（在編輯對話框中）
    if (deleteVocabBtn) {
        deleteVocabBtn.addEventListener('click', function() {
            if (!editingVocabId || deleteVocabBtn.disabled) return;
            
            currentAction = 'deleteSingle';
            dialogTitle.textContent = '刪除詞彙';
            dialogMessage.textContent = `你確定要刪除這個詞彙嗎？這個操作無法撤銷。`;
            confirmDialog.classList.add('active');
        });
    }
    
    // 詞彙列表相關功能
    function updateVocabListTable() {
        if (!vocabListBody) return;
        
        const allVocab = window.vocabStorage.getAllVocab();
        
        // 應用篩選
        let filteredVocab = allVocab;
        if (currentFilter === 'custom') {
            filteredVocab = allVocab.filter(vocab => vocab.id >= 1000);
        } else if (currentFilter === 'original') {
            filteredVocab = allVocab.filter(vocab => vocab.id < 1000);
        }
        
        // 應用搜尋
        if (currentSearch) {
            const searchLower = currentSearch.toLowerCase();
            filteredVocab = filteredVocab.filter(vocab => 
                (vocab.hiragana && vocab.hiragana.toLowerCase().includes(searchLower)) ||
                (vocab.kanji && vocab.kanji.toLowerCase().includes(searchLower)) ||
                (vocab.definition && vocab.definition.toLowerCase().includes(searchLower))
            );
        }
        
        // 計算分頁
        const totalItems = filteredVocab.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        // 確保當前頁有效
        if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
        
        // 獲取當前頁的詞彙
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const pageVocab = filteredVocab.slice(startIndex, endIndex);
        
        // 清空表格
        vocabListBody.innerHTML = '';
        
        // 填充表格
        if (pageVocab.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center; padding: 20px; color: #7f8c8d;">沒有找到詞彙</td>`;
            vocabListBody.appendChild(row);
        } else {
            pageVocab.forEach(vocab => {
                const row = document.createElement('tr');
                if (vocab.id >= 1000) {
                    row.classList.add('custom-vocab');
                }
                
                row.innerHTML = `
                    <td>${vocab.id}</td>
                    <td>${vocab.hiragana}</td>
                    <td>${vocab.kanji || '-'}</td>
                    <td>${vocab.definition.length > 30 ? vocab.definition.substring(0, 30) + '...' : vocab.definition}</td>
                    <td>
                        <div class="action-buttons-small">
                            <button class="edit-btn" data-id="${vocab.id}" ${vocab.id < 1000 ? 'disabled title="原始詞彙不能編輯"' : ''}>
                                <i class="fas fa-edit"></i> 編輯
                            </button>
                            <button class="delete-btn" data-id="${vocab.id}" ${vocab.id < 1000 ? 'disabled title="原始詞彙不能刪除"' : ''}>
                                <i class="fas fa-trash"></i> 刪除
                            </button>
                        </div>
                    </td>
                `;
                
                vocabListBody.appendChild(row);
            });
            
            // 為編輯和刪除按鈕添加事件監聽器
            document.querySelectorAll('.edit-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', function() {
                    const vocabId = parseInt(this.getAttribute('data-id'));
                    openEditDialog(vocabId);
                });
            });
            
            document.querySelectorAll('.delete-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', function() {
                    const vocabId = parseInt(this.getAttribute('data-id'));
                    editingVocabId = vocabId;
                    
                    currentAction = 'deleteSingle';
                    dialogTitle.textContent = '刪除詞彙';
                    dialogMessage.textContent = `你確定要刪除這個詞彙嗎？這個操作無法撤銷。`;
                    confirmDialog.classList.add('active');
                });
            });
        }
        
        // 更新分頁信息
        if (pageInfo) {
            pageInfo.textContent = `第 ${currentPage} 頁 / 共 ${totalPages} 頁 (共 ${totalItems} 個詞彙)`;
        }
        
        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
        }
    }
    
    // 篩選按鈕事件
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            currentPage = 1;
            updateVocabListTable();
        });
    });
    
    // 搜尋功能
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearch = this.value.trim();
            currentPage = 1;
            updateVocabListTable();
        });
    }
    
    // 分頁功能
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                updateVocabListTable();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const allVocab = window.vocabStorage.getAllVocab();
            const totalPages = Math.ceil(allVocab.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updateVocabListTable();
            }
        });
    }
    
    // 更新批量輸入預覽
    function updateBulkPreview() {
        if (!bulkInput || !bulkPreview) return;
        
        const text = bulkInput.value.trim();
        if (!text) {
            bulkPreview.innerHTML = '請輸入數據以查看預覽...';
            return;
        }
        
        const lines = text.split('\n').filter(line => line.trim() !== '').slice(0, 3);
        let previewHTML = '';
        
        lines.forEach((line, index) => {
            const parts = line.split('|');
            if (parts.length >= 3) {
                previewHTML += `<div class="preview-item"><strong>${index + 1}.</strong> ${parts[0]} → ${parts[1] || parts[0]}</div>`;
            } else {
                previewHTML += `<div class="preview-item" style="color: #e74c3c;"><strong>${index + 1}.</strong> 格式錯誤（需要至少3個欄位）</div>`;
            }
        });
        
        const totalLines = text.split('\n').filter(line => line.trim() !== '').length;
        if (totalLines > 3) {
            previewHTML += `<div class="preview-item">... 還有 ${totalLines - 3} 個詞彙</div>`;
        }
        
        bulkPreview.innerHTML = previewHTML;
    }
    
    // 更新統計數據
    function updateStats() {
        const allVocab = window.getAllVocabData();
        const originalCount = window.getOriginalVocabCount();
        const customCount = window.getCustomVocabCount();
        
        if (totalCountElem) totalCountElem.textContent = allVocab.length;
        if (originalCountElem) originalCountElem.textContent = originalCount;
        if (customCountElem) customCountElem.textContent = customCount;
    }
    
    // 顯示通知訊息
    function showNotification(message, type = 'success') {
        if (notification && notificationMessage) {
            notificationMessage.textContent = message;
            notification.className = 'notification';
            
            if (type === 'error') {
                notification.style.background = '#e74c3c';
            } else if (type === 'warning') {
                notification.style.background = '#f39c12';
            } else {
                notification.style.background = '#27ae60';
            }
            
            notification.classList.add('active');
            
            // 3秒後自動隱藏
            setTimeout(() => {
                notification.classList.remove('active');
            }, 3000);
        } else {
            // 如果通知元素不存在，使用alert
            alert(message);
        }
    }
    
    // 初始更新統計數據
    updateStats();
    
    // 為表單添加Enter鍵提交功能
    const formInputs = [hiraganaInput, kanjiInput, definitionInput, exampleInput, translationInput];
    formInputs.forEach(input => {
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (addVocabBtn) addVocabBtn.click();
                }
            });
        }
    });
});
