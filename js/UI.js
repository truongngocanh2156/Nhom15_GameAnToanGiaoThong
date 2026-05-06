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

    updateTime(time) {
        if (this.timeDisplay) this.timeDisplay.innerText = time;
    }

    showWarning(message) {
        this.warningDisplay.innerText = message;
        this.warningDisplay.style.display = 'block';
    }

    hideWarning() {
        this.warningDisplay.style.display = 'none';
    }

    showSuccess() {
        this.successDisplay.style.display = 'block';
        setTimeout(() => this.successDisplay.style.display = 'none', 1500);
    }

    toggleVisibility(isVisible) {
        if (this.container) {
            this.container.style.display = isVisible ? 'block' : 'none';
        }
    }

    // --- Chuyển các function thành Method (bỏ chữ function) ---
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
        // Đợi DOM sẵn sàng nếu class này được import sớm
        document.addEventListener('DOMContentLoaded', () => {
            const nextBtn = document.querySelector('.btn-next');
            const backBtn = document.querySelector('.btn-back');

            if (nextBtn) {
                nextBtn.onclick = () => this.slideToNext('menu-screen', 'map-screen');
            }
            if (backBtn) {
                backBtn.onclick = () => this.slideToBack('map-screen', 'menu-screen');
            }
        });
    }
}
