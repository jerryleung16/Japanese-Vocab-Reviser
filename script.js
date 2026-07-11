// 等待網頁完全載入
document.addEventListener('DOMContentLoaded', function() {
    // 取得DOM元素
    const vocabCard = document.getElementById('vocabCard');
    const frontText = document.getElementById('frontText');
    const backKanji = document.getElementById('backKanji');
    
    const markKnownBtn = document.getElementById('markKnownBtn');
    const markUnknownBtn = document.getElementById('markUnknownBtn');
    const filterUnknownBtn = document.getElementById('filterUnknownBtn');
    const resetStatusBtn = document.getElementById('resetStatusBtn');
    const statusBadgeFront = document.getElementById('statusBadgeFront');
    const statusBadgeBack = document.getElementById('statusBadgeBack');
    
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
    let showOnlyUnknown = false; // 新增：是否只顯示不熟詞彙
    
    // 更新詞彙列表函數
    function updateVocabList() {
        let allVocab = window.vocabStorage.getAllVocab();
        
        if (showOnlyUnknown) {
            // 只篩選出不在「已學會」列表中的單字
            const knownIds = window.vocabStorage.getKnownVocabIds();
            currentVocabList = allVocab.filter(vocab => !knownIds.includes(vocab.id));
        } else {
            currentVocabList = allVocab;
        }
        
        // 確保索引不越界
        currentIndex = Math.min(currentIndex, currentVocabList.length - 1);
        if (currentIndex < 0) currentIndex = 0;
        
        updateCard();
    }
    
    // 公開更新函數供管理面板使用
    window.updateCard = updateCard;
    
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

        if(markKnownBtn) markKnownBtn.addEventListener('click', () => setVocabStatus(true));
        if(markUnknownBtn) markUnknownBtn.addEventListener('click', () => setVocabStatus(false));
        if(filterUnknownBtn) filterUnknownBtn.addEventListener('click', toggleFilterMode);
        if(resetStatusBtn) resetStatusBtn.addEventListener('click', resetStatus);
        
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

    function setVocabStatus(isKnown) {
        if (currentVocabList.length === 0) return;
        const currentVocab = currentVocabList[currentIndex];
        
        if (isKnown) {
            window.vocabStorage.markAsKnown(currentVocab.id);
            showNotification('已標記為「已學會」', 'success');
        } else {
            window.vocabStorage.markAsUnknown(currentVocab.id);
            showNotification('已標記為「還不熟」', 'warning');
        }
        
        if (showOnlyUnknown && isKnown) {
            // 如果在過濾模式下標記為學會，則該字會從列表中移除，刷新列表
            updateVocabList();
        } else {
            // 否則僅更新當前卡片顯示狀態
            updateCard();
        }
    }
    
    // 新增：切換過濾模式
    function toggleFilterMode() {
        showOnlyUnknown = !showOnlyUnknown;
        filterUnknownBtn.classList.toggle('active', showOnlyUnknown);
        filterUnknownBtn.textContent = showOnlyUnknown ? '顯示所有詞彙' : '只顯示不熟詞彙';
        
        updateVocabList();
        showNotification(showOnlyUnknown ? '已切換：只顯示不熟的詞彙' : '已切換：顯示所有詞彙');
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

        if (currentVocabList.length === 0) {
            frontText.textContent = showOnlyUnknown ? "沒有不熟的詞彙了！" : "無詞彙數據";
            backKanji.textContent = showOnlyUnknown ? "太棒了！" : "請添加詞彙";
            // ... [清空其他文本] ...
            if (statusBadgeFront) statusBadgeFront.style.display = 'none';
            if (statusBadgeBack) statusBadgeBack.style.display = 'none';
            updateProgress();
            return;
        }
        
        const currentVocab = currentVocabList[currentIndex];
        if (!currentVocab) return;
        
        // 重置卡片為正面
        vocabCard.classList.remove('flipped');
        isFlipped = false;
        
        // 更新狀態徽章
        const isKnown = window.vocabStorage.isKnown(currentVocab.id);
        const badgeText = isKnown ? "✅ 已學會" : "❌ 還不熟";
        const badgeClass = isKnown ? "known-badge" : "unknown-badge";
        
        if (statusBadgeFront && statusBadgeBack) {
            statusBadgeFront.style.display = 'block';
            statusBadgeBack.style.display = 'block';
            statusBadgeFront.textContent = badgeText;
            statusBadgeBack.textContent = badgeText;
            
            // 更新 Class
            statusBadgeFront.className = `status-badge ${badgeClass}`;
            statusBadgeBack.className = `status-badge ${badgeClass}`;
        }
        
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
