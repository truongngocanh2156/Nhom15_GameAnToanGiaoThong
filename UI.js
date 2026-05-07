export class UI {
    constructor() {
        this.container = document.getElementById('ui');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.speedDisplay = document.getElementById('speedDisplay');
        this.warningDisplay = document.getElementById('warning');
        this.successDisplay = document.getElementById('success');

        // Khởi tạo sự kiện cho nút bấm ngay khi Class được tạo
        this.initEventListeners();
    }

    updateSpeed(speed) {
        if (this.speedDisplay) {
            this.speedDisplay.innerText = Math.abs(Math.round(speed * 200));
        }
    }

    updateScore(score) {
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) scoreDisplay.innerText = score + "/3";
    }

    updateTime(time) {
        if (this.timeDisplay) this.timeDisplay.innerText = time;
    }

    showWarning(message) {
        if (this.warningDisplay) {
            this.warningDisplay.innerText = message;
            this.warningDisplay.style.display = 'block';
        }
    }

    hideWarning() {
        if (this.warningDisplay) this.warningDisplay.style.display = 'none';
    }

    showSuccess(message = "✅ HOÀN THÀNH!") {
        if (this.successDisplay) {
            this.successDisplay.innerText = message;
            this.successDisplay.style.display = 'block';
            setTimeout(() => this.successDisplay.style.display = 'none', 1500);
        }
    }

    toggleVisibility(isVisible) {
        if (this.container) {
            this.container.style.display = isVisible ? 'block' : 'none';
        }
    }

    slideToNext(currentId, nextId) {
        const currentScreen = document.getElementById(currentId);
        const nextScreen = document.getElementById(nextId);

        if (currentScreen && nextScreen) {
            currentScreen.classList.replace('active', 'prev');
            nextScreen.classList.replace('next', 'active');
        }
    }

    slideToBack(currentId, prevId) {
        const currentScreen = document.getElementById(currentId);
        const prevScreen = document.getElementById(prevId);

        if (currentScreen && prevScreen) {
            currentScreen.classList.replace('active', 'next');
            prevScreen.classList.replace('prev', 'active');
        }
    }

    // Hàm khởi tạo sự kiện
    initEventListeners() {
        // Sử dụng một biến check để tránh gán sự kiện nhiều lần nếu class bị khởi tạo lại
        document.addEventListener('DOMContentLoaded', () => {
            // 1. Xử lý các nút điều hướng cơ bản
            const nextBtn = document.querySelector('.btn-next');
            const backBtn = document.querySelector('.btn-back');

            if (nextBtn) {
                nextBtn.onclick = () => this.slideToNext('menu-screen', 'map-screen');
            }
            if (backBtn) {
                backBtn.onclick = () => this.slideToBack('map-screen', 'menu-screen');
            }

            // 2. XỬ LÝ NÚT CHƠI LẠI (Sửa theo yêu cầu của bạn)
            const replayAction = () => {
                // Gọi hàm reset của instance Game được gắn toàn cục
                if (window.gameInstance) {
                    window.gameInstance.resetGame();
                } else {
                    // Nếu không tìm thấy instance, mới dùng fallback reload
                    location.reload();
                }
            };

            // Gán sự kiện cho nút ở màn hình kết thúc 1
            const replayBtn = document.getElementById('btn-replay');
            if (replayBtn) {
                replayBtn.onclick = (e) => {
                    e.preventDefault();
                    replayAction();
                };
            }

            // Gán sự kiện cho nút ở màn hình tổng kết (summary-overlay)
            const replaySummaryBtn = document.getElementById('btn-replay-summary');
            if (replaySummaryBtn) {
                replaySummaryBtn.onclick = (e) => {
                    e.preventDefault();
                    replayAction();
                };
            }

            // Nút trang chủ (luôn tải lại trang chủ để chọn lại xe/map)
            const homeBtn = document.getElementById('btn-home');
            if (homeBtn) {
                homeBtn.onclick = () => {
                    window.location.href = 'index.html';
                };
            }
        });
    }
}