// Inisialisasi aplikasi antrian
class QueueSystem {
    constructor() {
        this.initializeElements();
        this.initializeVariables();
        this.initializeEventListeners();
        this.updateDateTime();
        this.updateCallHistory();
        this.initializeSpeechSynthesis();
    }

    // Inisialisasi elemen DOM
    initializeElements() {
        // Elemen tampilan
        this.currentQueueElement = document.getElementById('current-queue');
        this.currentOperatorElement = document.getElementById('current-operator');
        this.queueNumberInput = document.getElementById('queue-number');
        this.operatorSelect = document.getElementById('operator-select');
        
        // Tombol kontrol
        this.callQueueButton = document.getElementById('call-queue');
        this.prevQueueButton = document.getElementById('prev-queue');
        this.nextQueueButton = document.getElementById('next-queue');
        
        // Pengaturan suara
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeValue = document.getElementById('volume-value');
        this.testSoundButton = document.getElementById('test-sound');
        this.stopSoundButton = document.getElementById('stop-sound');
        
        // Riwayat
        this.callHistoryElement = document.getElementById('call-history');
        this.clearHistoryButton = document.getElementById('clear-history');
        
        // Waktu dan tanggal
        this.currentDateElement = document.getElementById('current-date');
        this.currentTimeElement = document.getElementById('current-time');
        this.currentYearElement = document.getElementById('current-year');
        
        // Notifikasi
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notification-text');
        
        // Audio
        this.audioContext = null;
    }

    // Inisialisasi variabel
    initializeVariables() {
        this.currentQueue = 1;
        this.currentOperator = 1;
        this.volume = parseFloat(localStorage.getItem('queueVolume')) || 0.7;
        this.callHistory = JSON.parse(localStorage.getItem('callHistory')) || [];
        this.isSpeaking = false;
        this.speechSynthesis = window.speechSynthesis;
        
        // Update tahun di footer
        this.currentYearElement.textContent = new Date().getFullYear();
        
        // Update volume slider
        this.volumeSlider.value = this.volume;
        this.volumeValue.textContent = `${Math.round(this.volume * 100)}%`;
    }

    // Inisialisasi event listeners
    initializeEventListeners() {
        // Tombol panggil antrian
        this.callQueueButton.addEventListener('click', () => this.callQueue());
        
        // Navigasi antrian
        this.prevQueueButton.addEventListener('click', () => this.navigateQueue(-1));
        this.nextQueueButton.addEventListener('click', () => this.navigateQueue(1));
        
        // Input nomor antrian
        this.queueNumberInput.addEventListener('change', () => {
            this.currentQueue = parseInt(this.queueNumberInput.value) || 1;
            this.updateQueueDisplay();
        });
        
        // Pilih operator
        this.operatorSelect.addEventListener('change', () => {
            this.currentOperator = parseInt(this.operatorSelect.value);
            this.updateQueueDisplay();
        });
        
        // Pengaturan volume
        this.volumeSlider.addEventListener('input', (e) => {
            this.volume = parseFloat(e.target.value);
            this.volumeValue.textContent = `${Math.round(this.volume * 100)}%`;
            localStorage.setItem('queueVolume', this.volume);
        });
        
        // Tombol suara
        this.testSoundButton.addEventListener('click', () => this.testSound());
        this.stopSoundButton.addEventListener('click', () => this.stopSound());
        
        // Hapus riwayat
        this.clearHistoryButton.addEventListener('click', () => this.clearHistory());
    }

    // Inisialisasi speech synthesis
    initializeSpeechSynthesis() {
        // Cek apakah browser mendukung speech synthesis
        if (!('speechSynthesis' in window)) {
            this.showNotification('Browser tidak mendukung fitur suara');
            this.callQueueButton.disabled = true;
            this.testSoundButton.disabled = true;
        }
    }

    // Format nomor antrian (3 digit)
    formatQueueNumber(number) {
        return number.toString().padStart(3, '0');
    }

    // Navigasi antrian
    navigateQueue(direction) {
        this.currentQueue = Math.max(1, this.currentQueue + direction);
        this.queueNumberInput.value = this.currentQueue;
        this.updateQueueDisplay();
    }

    // Update tampilan antrian
    updateQueueDisplay() {
        this.currentQueueElement.textContent = this.formatQueueNumber(this.currentQueue);
        this.currentOperatorElement.textContent = `OPERATOR ${this.currentOperator}`;
    }

    // Update tanggal dan waktu
    updateDateTime() {
        const now = new Date();
        
        // Format tanggal
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const formattedDate = now.toLocaleDateString('id-ID', options);
        this.currentDateElement.textContent = formattedDate;
        
        // Format waktu
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        this.currentTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
        
        // Update setiap detik
        setTimeout(() => this.updateDateTime(), 1000);
    }

    // Panggil antrian
    async callQueue() {
        const queueNumber = this.formatQueueNumber(this.currentQueue);
        const operatorName = `Operator ${this.currentOperator}`;
        
        // Simpan ke riwayat
        this.saveToHistory(queueNumber, operatorName);
        
        // Update riwayat tampilan
        this.updateCallHistory();
        
        // Tampilkan notifikasi
        this.showNotification(`Memanggil antrian ${queueNumber} ke ${operatorName}`);
        
        // Mainkan suara panggilan bandara terlebih dahulu
        await this.playAirportSound();
        
        // Kemudian ucapkan nomor antrian
        await this.speakQueue(queueNumber, operatorName);
        
        // Auto increment antrian
        this.navigateQueue(1);
    }

    // Simpan ke riwayat
    saveToHistory(queueNumber, operatorName) {
        const historyItem = {
            timestamp: new Date().toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            }),
            queueNumber: queueNumber,
            operator: operatorName
        };
        
        this.callHistory.unshift(historyItem);
        
        // Simpan maksimal 50 riwayat
        if (this.callHistory.length > 50) {
            this.callHistory.pop();
        }
        
        localStorage.setItem('callHistory', JSON.stringify(this.callHistory));
    }

    // Update riwayat tampilan
    updateCallHistory() {
        this.callHistoryElement.innerHTML = '';
        
        if (this.callHistory.length === 0) {
            this.callHistoryElement.innerHTML = '<div class="empty-history">Belum ada riwayat pemanggilan</div>';
            return;
        }
        
        this.callHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-time">${item.timestamp}</div>
                <div class="history-details">
                    <span class="queue-badge">${item.queueNumber}</span>
                    <span class="operator-badge">${item.operator}</span>
                </div>
            `;
            this.callHistoryElement.appendChild(historyItem);
        });
    }

    // Hapus riwayat
    clearHistory() {
        if (this.callHistory.length === 0) return;
        
        if (confirm('Apakah Anda yakin ingin menghapus semua riwayat pemanggilan?')) {
            this.callHistory = [];
            localStorage.setItem('callHistory', JSON.stringify(this.callHistory));
            this.updateCallHistory();
            this.showNotification('Riwayat pemanggilan telah dihapus');
        }
    }

    // Mainkan suara panggilan bandara
    async playAirportSound() {
        return new Promise((resolve) => {
            try {
                // Buat audio context jika belum ada
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                // Buat sumber audio
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                // Konfigurasi untuk suara panggilan bandara
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                
                // Envelope untuk suara panggilan
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
                
                // Hubungkan node
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Mainkan suara
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.5);
                
                // Tunggu suara selesai
                setTimeout(resolve, 600);
            } catch (error) {
                console.error('Error playing airport sound:', error);
                resolve();
            }
        });
    }

    // Ucapkan nomor antrian
    async speakQueue(queueNumber, operatorName) {
        return new Promise((resolve) => {
            if (this.isSpeaking) {
                this.speechSynthesis.cancel();
            }
            
            // Siapkan teks untuk diucapkan
            const textToSpeak = `Nomor antrian ${this.splitDigits(queueNumber)}, silahkan menuju ke ${operatorName}. Terima kasih.`;
            
            // Buat utterance
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'id-ID';
            utterance.rate = 0.9; // Kecepatan sedang
            utterance.pitch = 1.2; // Suara lebih tinggi (wanita)
            utterance.volume = this.volume;
            
            // Event handler
            utterance.onstart = () => {
                this.isSpeaking = true;
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                resolve();
            };
            
            utterance.onerror = () => {
                this.isSpeaking = false;
                resolve();
            };
            
            // Cari suara wanita jika tersedia
            const voices = this.speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.lang.includes('id') && 
                (voice.name.toLowerCase().includes('female') || 
                 voice.name.toLowerCase().includes('perempuan') ||
                 voice.name.toLowerCase().includes('wanita'))
            ) || voices.find(voice => voice.lang.includes('id'));
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            // Mulai berbicara
            this.speechSynthesis.speak(utterance);
        });
    }

    // Pisahkan digit untuk pengucapan yang lebih jelas
    splitDigits(number) {
        return number.toString().split('').join(' ');
    }

    // Uji suara
    testSound() {
        const testText = "Ini adalah uji suara sistem antrian SPMB SMA Negeri 1 Magetan. Sistem suara berfungsi dengan baik.";
        const utterance = new SpeechSynthesisUtterance(testText);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        utterance.pitch = 1.2;
        utterance.volume = this.volume;
        
        this.speechSynthesis.speak(utterance);
        this.showNotification('Menguji suara sistem...');
    }

    // Stop suara
    stopSound() {
        if (this.isSpeaking) {
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.showNotification('Suara dihentikan');
        }
    }

    // Tampilkan notifikasi
    showNotification(message) {
        this.notificationText.textContent = message;
        this.notification.classList.add('show');
        
        // Sembunyikan setelah 3 detik
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }
}

// Inisialisasi aplikasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    const queueSystem = new QueueSystem();
    
    // Update tampilan awal
    queueSystem.updateQueueDisplay();
    
    // Load voices untuk speech synthesis
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
            // Voices sudah dimuat
        };
    }
});