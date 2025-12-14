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
    const masteryBadge = document.getElementById('masteryBadge');
    const masteryButtons = document.querySelectorAll('.mastery-btn');
    
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
    let currentReviewFilter = window.getCurrentReviewFilter ? window.getCurrentReviewFilter() : 'all';
    
    // 更新詞彙列表函數（考慮掌握程度篩選）
    function updateVocabList() {
        if (currentReviewFilter === 'all') {
            currentVocabList = window.getAllVocabData();
        } else {
            currentVocabList = window.getVocabByMastery(currentReviewFilter);
        }
        
        currentIndex = Math.min(currentIndex, currentVocabList.length - 1);
        if (currentIndex < 0) currentIndex = 0;
        updateCard();
    }
    
    // 公開更新函數供管理面板使用
    window.updateCard = updateCard;
    window.updateVocabList = updateVocabList;
    window.showNext = showNext;
    
    // 獲取當前詞彙
    window.getCurrentVocab = () => currentVocabList[currentIndex];
    
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
        
        // 掌握程度按鈕快捷鍵
        document.addEventListener('keydown', handleMasteryKeyPress);
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
            masteryBadge.style.display = 'none';
            updateProgress();
            return;
        }
        
        const currentVocab = currentVocabList[currentIndex];
        
        if (!currentVocab) return;
        
        // 重置卡片為正面
        vocabCard.classList.remove('flipped');
        isFlipped = false;
        
        // 獲取掌握程度
        const mastery = window.getMastery(currentVocab.id);
        
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
        
        // 更新掌握程度徽章和按鈕狀態
        updateMasteryDisplay(mastery);
        
        updateProgress();
    }
    
    // 更新掌握程度顯示
    function updateMasteryDisplay(mastery) {
        // 更新徽章
        if (mastery) {
            let badgeText = '';
            let badgeClass = '';
            
            switch(mastery) {
                case 'know':
                    badgeText = '已掌握';
                    badgeClass = 'know';
                    break;
                case 'review':
                    badgeText = '需複習';
                    badgeClass = 'review';
                    break;
                case 'dont-know':
                    badgeText = '未掌握';
                    badgeClass = 'dont-know';
                    break;
            }
            
            masteryBadge.textContent = badgeText;
            masteryBadge.className = 'mastery-badge ' + badgeClass;
            masteryBadge.style.display = 'inline-block';
        } else {
            masteryBadge.style.display = 'none';
        }
        
        // 更新按鈕狀態
        masteryButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-mastery') === mastery) {
                button.classList.add('active');
            }
        });
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
                const statsPanel = document.getElementById('statsPanel');
                if (managementPanel) {
                    managementPanel.classList.remove('active');
                }
                if (statsPanel) {
                    statsPanel.classList.remove('active');
                }
                break;
        }
    }
    
    // 處理掌握程度快捷鍵
    function handleMasteryKeyPress(event) {
        // 只有當卡片翻到背面時才處理掌握程度快捷鍵
        if (!isFlipped) return;
        
        switch(event.key) {
            case '1':
            case '&': // 數字1
                document.querySelector('.mastery-btn.know').click();
                event.preventDefault();
                break;
            case '2':
            case 'é': // 數字2
                document.querySelector('.mastery-btn.review').click();
                event.preventDefault();
                break;
            case '3':
            case '"': // 數字3
                document.querySelector('.mastery-btn.dont-know').click();
                event.preventDefault();
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
