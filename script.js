// Game State
let currentLevel = 'easy';
let score = 0;
let timeLeft = 60;
let timerInterval;
let currentCorrectAnswer = 0;

// Audio Context for synthesized sounds
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'correct') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'wrong') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#fbc531', '#4cd137', '#00a8ff', '#e84118', '#e84393']
        });
    }
}

function startGame(level) {
    initAudio(); // Initialize audio on first user interaction
    currentLevel = level;
    score = 0;
    timeLeft = 60;
    
    document.getElementById('score').innerText = score;
    document.getElementById('time-left').innerText = timeLeft;
    document.getElementById('progress-bar').style.width = '100%';
    
    showScreen('game-screen');
    nextQuestion();
    
    // Start timer
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;
        document.getElementById('progress-bar').style.width = `${(timeLeft / 60) * 100}%`;
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showStartScreen() {
    showScreen('start-screen');
}

function endGame() {
    clearInterval(timerInterval);
    showScreen('end-screen');
    document.getElementById('final-score-value').innerText = score;
    
    const endMessage = document.getElementById('end-message');
    if (score > 20) {
        endMessage.innerText = "Wow! You are a Math Genius! 🌟";
        triggerConfetti();
    } else if (score > 10) {
        endMessage.innerText = "Great job! You are a Math Star! ⭐";
    } else {
        endMessage.innerText = "Good try! Keep practicing! 🎈";
    }
}

function generateNumbers() {
    let num1, num2;
    if (currentLevel === 'easy') {
        num1 = Math.floor(Math.random() * 5) + 1; // 1-5
        num2 = Math.floor(Math.random() * 5) + 1;
    } else if (currentLevel === 'medium') {
        num1 = Math.floor(Math.random() * 9) + 2; // 2-10
        num2 = Math.floor(Math.random() * 9) + 2;
    } else {
        num1 = Math.floor(Math.random() * 7) + 6; // 6-12
        num2 = Math.floor(Math.random() * 7) + 6;
    }
    return { num1, num2 };
}

function nextQuestion() {
    const { num1, num2 } = generateNumbers();
    currentCorrectAnswer = num1 * num2;
    
    // Animate question
    const questionEl = document.getElementById('question');
    questionEl.innerText = `${num1} × ${num2} = ?`;
    questionEl.classList.remove('pop-in');
    void questionEl.offsetWidth; // trigger reflow
    questionEl.classList.add('pop-in');
    
    // Generate options
    let options = [currentCorrectAnswer];
    while (options.length < 4) {
        let offset = Math.floor(Math.random() * 10) - 5;
        if (offset === 0) offset = 1;
        let wrongAnswer = currentCorrectAnswer + offset;
        // make sure it's positive and not already in options
        if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
            options.push(wrongAnswer);
        }
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    
    // Render buttons
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn option-btn pop-in';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, btn);
        optionsContainer.appendChild(btn);
    });
    
    // Reset feedback
    document.getElementById('feedback-text').style.opacity = '0';
    document.getElementById('feedback-monster').classList.remove('shake');
}

function checkAnswer(selected, button) {
    const feedbackText = document.getElementById('feedback-text');
    const monster = document.getElementById('feedback-monster');
    
    if (selected === currentCorrectAnswer) {
        // Correct
        playSound('correct');
        score++;
        document.getElementById('score').innerText = score;
        triggerConfetti();
        
        feedbackText.innerText = "YAY! ⭐";
        feedbackText.style.color = "#4cd137";
        feedbackText.style.opacity = '1';
        
        // Bounce monster
        monster.classList.remove('bounce-in');
        void monster.offsetWidth;
        monster.classList.add('bounce-in');
        
        setTimeout(nextQuestion, 1000);
    } else {
        // Wrong
        playSound('wrong');
        
        feedbackText.innerText = "Oops! Try again!";
        feedbackText.style.color = "#e84118";
        feedbackText.style.opacity = '1';
        
        button.style.backgroundColor = '#e84118';
        button.style.boxShadow = '0 8px 0px #c23616';
        
        // Shake monster
        monster.classList.remove('shake');
        void monster.offsetWidth;
        monster.classList.add('shake');
        
        // Disable wrong button
        button.disabled = true;
        button.style.opacity = '0.5';
    }
}
