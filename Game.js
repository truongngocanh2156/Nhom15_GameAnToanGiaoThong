import { UI } from './UI.js';
import { World } from './World.js';
import { Car, NPCCar } from './Car.js'; 

const crashSfx = new Audio('assets/textures/crash_sound.mp3'); 
crashSfx.volume = 0.6; 

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.008);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        this.mapCamera = new THREE.OrthographicCamera(-80, 80, 60, -60, 1, 1000);
        
        // Biến dùng để làm mượt điểm nhìn của camera
        this.cameraLookTarget = new THREE.Vector3();

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.autoClear = false;
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2)); 
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const urlParams = new URLSearchParams(window.location.search);
        this.mapId = parseInt(urlParams.get('map')) || parseInt(localStorage.getItem('selectedMap')) || 1; 
        //Hiển thị tên map lên UI
        const mapDisplay = document.getElementById('mapNameDisplay');
        if (mapDisplay) {
            if (this.mapId === 2) {
                mapDisplay.innerText = "ĐƯỜNG ĐẾN CÔNG VIÊN";
                mapDisplay.style.color = "#2ecc71"; // Màu xanh lá cho công viên
            } else {
                mapDisplay.innerText = "ĐƯỜNG ĐẾN UET";
                mapDisplay.style.color = "#f1c40f"; // Màu vàng cho UET
            }
        }
        this.ui = new UI();
        this.world = new World(this.scene, this.mapId); 
        this.car = null;

        this.level = 1;
        this.timeLeft = 200;
        this.gameActive = false; 
        this.isMapExpanded = false;
        this.currentTarget = null;
        this.keys = {};
        this.answeredTiles = new Set();

        this.score = 0;
        this.startTime = Date.now(); 
        this.totalEncounters = 0;    
        this.questions = []; 
        this.totalQuestions = 0;
        this.currentQuestionIndex = 0;
        this.inQuiz = false;
        this.justAnswered = false;

        this.loadQuizData(); 
        this.setupEvents();
        this.start();

        this.npcCars = []; 
        this.clock = new THREE.Clock(); 
    }

    // --- HÀM LOAD DỮ LIỆU TỪ FILE JSON VÀ LỌC THEO CHỦ ĐỀ ---
    async loadQuizData() {
        try {
            const response = await fetch('quiz.json');
            const data = await response.json();
            
            // 1. Lấy toàn bộ câu hỏi từ file JSON
            let allQuestions = data.questions;

            // 2. Lọc theo chủ đề đã chọn (Lấy từ localStorage hoặc menu của bạn)
            const selectedTopic = localStorage.getItem('selectedQuizTopic') || 'all';
            let filteredQuestions = (selectedTopic === 'all') 
                ? allQuestions 
                : allQuestions.filter(q => q.type === selectedTopic);

            // Nếu lọc xong mà không có câu nào, dùng tạm toàn bộ để tránh lỗi
            if (filteredQuestions.length === 0) filteredQuestions = allQuestions;

            // 3.TRỘN NGẪU NHIÊN (Sử dụng thuật toán Fisher-Yates để đảm bảo cực kỳ ngẫu nhiên)
            for (let i = filteredQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filteredQuestions[i], filteredQuestions[j]] = [filteredQuestions[j], filteredQuestions[i]];
            }
            
            this.questions = filteredQuestions.slice(0, 30);

            // 5. Cập nhật lại các thông số UI
            this.totalQuestions = this.questions.length; // Sẽ luôn là 30 (hoặc ít hơn nếu tổng kho không đủ 10)
            this.updateScoreUI();
            
            console.log(`✅ Chủ đề: ${selectedTopic} | Đã bốc ngẫu nhiên: ${this.totalQuestions} câu.`);
        } catch (error) {
            console.error("❌ Lỗi load quiz.json:", error);
        }
    }

    async start() {
        await this.world.init();
        
        // 1. Gọi video và gắn nút Skip NGAY LẬP TỨC
        this.playIntroVideo(); 

        // 2. Khởi tạo xe người chơi
        const startX = this.world.offsetX + 1.5 * this.world.cellSize;
        const startZ = this.world.offsetZ + 1.5 * this.world.cellSize;
        this.car = new Car(this.scene, startX, startZ);
        this.updateScoreUI();
        this.animate();

        // 3. Thả xe NPC (Delay 0.5s để không làm giật lag quá trình hiện video)
        setTimeout(() => {
            this.spawnNPCs(20); 
        }, 500);

        // 4. Tìm tọa độ đích (ô số 51)
        this.targetPos = null;
        for (let r = 0; r < this.world.mapRows; r++) {
            for (let c = 0; c < this.world.mapCols; c++) {
                if (this.world.mapData[r][c] === 51) {
                    this.targetPos = new THREE.Vector3(
                        c * this.world.cellSize + this.world.offsetX + this.world.cellSize / 2,
                        0,
                        r * this.world.cellSize + this.world.offsetZ + this.world.cellSize / 2
                    );
                    break;
                }
            }
        }
    } 

    // --- HÀM PHÁT VIDEO INTRO ---
    playIntroVideo() {
        const videoContainer = document.getElementById('intro-video-container');
        const videoElement = document.getElementById('intro-video');
        const skipBtn = document.getElementById('btn-skip-video');

        // Nếu lỗi không tìm thấy thẻ video thì cho vào game luôn
        if (!videoContainer || !videoElement) {
            this.startGameplay();
            return;
        }

        // Ép phát video
        videoElement.play().catch((err) => {
            console.warn("Trình duyệt chặn video autoplay, tự động vào game.", err);
            this.endIntro();
        });

        // Tự động vào game khi video chạy hết (ended)
        videoElement.onended = () => this.endIntro();
        
        // Bấm Skip thì vào game ngay (Kiểm tra xem nút có tồn tại không để tránh sập JS)
        if (skipBtn) {
            skipBtn.onclick = () => this.endIntro();
        }
    }

    // --- HÀM KẾT THÚC VIDEO ---
    endIntro() {
        const videoContainer = document.getElementById('intro-video-container');
        const videoElement = document.getElementById('intro-video');
        
        if (videoElement) videoElement.pause(); // Dừng nhạc/hình
        if (videoContainer) videoContainer.style.display = 'none'; // Ẩn overlay đi

        this.startGameplay(); // Chuyển giao sang trạng thái bắt đầu chơi
    }

    // --- HÀM BẮT ĐẦU VÀO GAME CHÍNH ---
    startGameplay() {
        this.gameActive = true; // Mở khóa cho xe di chuyển
        setInterval(() => this.updateTimer(), 1000); // Bây giờ mới bắt đầu đếm ngược thời gian
    }

    setupEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // --- BẬT/TẮT Minimap bằng phím F ---
            if (e.code === 'KeyF' || e.key.toLowerCase() === 'f') {
                this.isMapExpanded = !this.isMapExpanded; // Đảo ngược trạng thái hiện tại
                this.ui.toggleVisibility(!this.isMapExpanded); // Ẩn/hiện UI theo trạng thái map
            }
        });
        // Bắt sự kiện click chuột để tắt minimap
        window.addEventListener('mousedown', (event) => {
            if (this.isMapExpanded) {
                this.isMapExpanded = false;
                this.ui.toggleVisibility(true); 
            }
        });

        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        window.addEventListener('click', (e) => {
            const mapSize = 200;
            const mapX = window.innerWidth - mapSize - 20;
            const mapY = 20;
            const mouseX = e.clientX;
            const mouseY = window.innerHeight - e.clientY;

            if (mouseX >= mapX && mouseX <= mapX + mapSize && mouseY >= mapY && mouseY <= mapY + mapSize) {
                this.isMapExpanded = !this.isMapExpanded;
                this.ui.toggleVisibility(!this.isMapExpanded); // Ẩn/hiện UI theo trạng thái map
            }
        });
        document.getElementById('btn-replay').onclick = () => {
            location.reload();
        };

        document.getElementById('btn-home').onclick = () => {
            window.location.href = 'index.html';
        };

        document.getElementById('btn-next').onclick = () => {
            alert("🚧 Level tiếp theo bạn sẽ làm sau nhé!");
        };
    }

    updateTimer() {
        if (this.gameActive && this.timeLeft > 0) {
            this.timeLeft--;
            this.ui.updateTime(this.timeLeft);
            if (this.timeLeft <= 0) {
                this.handleGameEnd(false); // Thua do hết giờ
            }
        }
    }

    updateLogic() {
        const deltaTime = this.clock.getDelta();
        if (!this.gameActive || !this.car || this.inQuiz) return;

        // Cập nhật NPC và kiểm tra khoảng cách, ko render xe npc ở xa
        this.npcCars.forEach(npc => { 
            const dist = npc.mesh.position.distanceTo(this.car.mesh.position);
            
            if (dist > 150) {
                npc.mesh.visible = false; // Ẩn nếu quá xa
            } else {
                npc.mesh.visible = true; // Hiện nếu ở gần
                npc.update(deltaTime, this.car, this.npcCars, this.world.trafficLightStatus); 
            }
        });

        // Logic Lái Xe
        if (!this.isMapExpanded && this.gameActive) {
            if (this.keys['ArrowUp'] || this.keys['KeyW']) this.car.speed += 0.02;
            if (this.keys['ArrowDown'] || this.keys['KeyS']) this.car.speed -= 0.02;
            this.car.speed *= 0.95; // Friction

            if (Math.abs(this.car.speed) > 0.01) {
                const dir = this.car.speed > 0 ? 1 : -1; 
                if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.car.angle += 0.02 * dir;
                if (this.keys['ArrowRight'] || this.keys['KeyD']) this.car.angle -= 0.02 * dir;
            }
        }

        const nextX = this.car.mesh.position.x + Math.sin(this.car.angle) * this.car.speed;
        const nextZ = this.car.mesh.position.z + Math.cos(this.car.angle) * this.car.speed;

        const carTile = this.world.getTileAt(nextX, nextZ);
        if (carTile) {
            // --- LOGIC ĐÈN GIAO THÔNG ---
            if (carTile.val === 67) {
                const status = this.world.trafficLightStatus;

                if (status === "RED") {
                    if (Math.abs(this.car.speed) > 0.05) {
                        this.showTrafficWarning('RED');
                        this.car.speed = 0; // Phạt dừng xe
                    }
                } else if (status === "YELLOW") {
                    if (Math.abs(this.car.speed) > 0.1) {
                        this.showTrafficWarning('YELLOW');
                        this.car.speed *= 0.96; // Giảm tốc độ từ từ
                    }
                }
            }

            // --- Logic đích đến số 50/51 ---
            if (carTile.val === 50 || carTile.val === 51) {
                this.handleGameEnd(true);
                return;
            }

            // --- 2. KIỂM TRA CHƯỚNG NGẠI VẬT (CÂU HỎI) ---
            const quizTiles = [11];
            if (quizTiles.includes(carTile.val)) {
                const key = `${carTile.row}-${carTile.col}`;
                if (!this.answeredTiles.has(key) && !this.justAnswered) {
                    this.answeredTiles.add(key);

                    this.totalEncounters++; // Tăng số lượng câu hỏi đã "va" phải
                    this.updateScoreUI();

                    this.car.speed = 0;
                    this.startQuiz();
                    return;
                }
            }
        }

        // 🚨 QUIZ TRIGGER
        if (carTile && carTile.val === 11) {
            const key = `${carTile.row}-${carTile.col}`;

            if (!this.answeredTiles.has(key) && !this.inQuiz && !this.justAnswered) {
                this.answeredTiles.add(key);

                this.car.mesh.position.set(nextX, 0, nextZ);
                this.car.speed = 0;

                this.startQuiz();
                return;
            }
        }

        const corners = [
            this.world.getTileAt(nextX + this.car.radius, nextZ + this.car.radius),
            this.world.getTileAt(nextX - this.car.radius, nextZ - this.car.radius),
            this.world.getTileAt(nextX + this.car.radius, nextZ - this.car.radius),
            this.world.getTileAt(nextX - this.car.radius, nextZ + this.car.radius)
        ];

        this.ui.hideWarning();

        // Kiểm tra đèn đỏ
        if (carTile && carTile.val === 8 && this.world.trafficLightStatus === "RED" && Math.abs(this.car.speed) > 0.05) {
            this.car.speed *= 0.5;
            this.ui.showWarning("⚠️ VI PHẠM: VƯỢT ĐÈN ĐỎ!");
        }

        const isSafe = corners.every(c => c && [1, 8, 9, 11, 50, 51, 67].includes(c.val));

        if (isSafe) {
            this.car.mesh.rotation.y = this.car.angle;
            this.car.mesh.position.set(nextX, 0, nextZ);
        } else {
            let hitTarget = false;
            for (let c of corners) {
                if (c && c.val === 10) {
                    hitTarget = true; 
                    break;
                }
            }
           if (hitTarget) {
                this.car.speed = 0;
                this.gameActive = false;

                this.ui.showSuccess();

                // Hiện menu end game
                document.getElementById('end-screen').style.display = 'flex';
            } else {
                this.car.speed *= -0.5; 
                this.ui.showWarning("⚠️ VA CHẠM VỈA HÈ!");
            }
        }

        this.ui.updateSpeed(this.car.speed);

        // Cập nhật hướng mũi tên
        if (this.car && this.car.arrowGroup && this.targetPos) {
            const lookTarget = new THREE.Vector3(
                this.targetPos.x,
                this.car.mesh.position.y + 5, // Cùng độ cao với mũi tên
                this.targetPos.z
            );
            this.car.arrowGroup.lookAt(lookTarget);
        }

        // Camera đi theo xe
        const relativeOffset = new THREE.Vector3(0, 6, -15);
        this.camera.position.lerp(relativeOffset.applyMatrix4(this.car.mesh.matrixWorld), 0.1);
        this.camera.lookAt(this.car.mesh.position.x, 2, this.car.mesh.position.z);

        // Xử lý Minimap
        if (this.isMapExpanded) {
            this.scene.fog.density = 0;
            this.mapCamera.position.set(0, 400, 0);
            this.mapCamera.lookAt(0, 0, 0);
            this.updateFullMapCamera(); // Tự động căn chỉnh map vừa màn hình
        } else {
            this.scene.fog.density = 0.005;
            
            // Reset lại kích thước camera cho minimap góc phải
            this.mapCamera.left = -80;
            this.mapCamera.right = 80;
            this.mapCamera.top = 60;
            this.mapCamera.bottom = -60;
            this.mapCamera.updateProjectionMatrix();

            this.mapCamera.position.set(this.car.mesh.position.x, 100, this.car.mesh.position.z);
            this.mapCamera.lookAt(this.car.mesh.position.x, 0, this.car.mesh.position.z);
        }
    }

   startQuiz() {
        if (this.questions.length === 0) return;
        this.gameActive = false;
        this.inQuiz = true;

        const qData = this.questions[this.currentQuestionIndex];
        
        // Hiện Overlay và Khung Quiz
        document.getElementById('quiz-overlay').style.display = 'block';
        const quizBox = document.getElementById('quiz');
        quizBox.style.display = 'block';

        document.getElementById('quiz-question').innerText = qData.question;
        
        const quizImg = document.getElementById('quiz-image'); 
        if(quizImg) {
            if (qData.image) {
                quizImg.src = qData.image;
                quizImg.style.display = 'block';
            } else {
                quizImg.style.display = 'none';
            }
        }

        const answersDiv = document.getElementById('quiz-answers');
        answersDiv.innerHTML = '';

        qData.options.forEach((ansText) => {
            const btn = document.createElement('button');
            btn.innerText = ansText;
            btn.className = 'quiz-ans-btn'; 
            btn.onclick = () => this.answerQuestion(ansText, btn); 
            answersDiv.appendChild(btn);
        });
    }

    answerQuestion(userAnswerText, selectedBtn) {
        const qData = this.questions[this.currentQuestionIndex];
        const allBtns = document.querySelectorAll('.quiz-ans-btn');

        const soundCorrect = new Audio('assets/sounds/correct.mp3');
        const soundWrong = new Audio('assets/sounds/wrong.mp3');

        // Khóa tất cả các nút ngay lập tức
        allBtns.forEach(btn => btn.classList.add('ans-disabled'));

        if (userAnswerText === qData.answer) {
            selectedBtn.classList.add('ans-correct');
            soundCorrect.play(); 
            this.score++;
        } else {
            selectedBtn.classList.add('ans-wrong');
            soundWrong.play(); 
            
            allBtns.forEach(btn => {
                if (btn.innerText === qData.answer) {
                    btn.classList.add('ans-correct');
                }
            });
        }

        this.updateScoreUI();

        // Chờ 2 giây
        setTimeout(() => {
            document.getElementById('quiz-overlay').style.display = 'none';
            document.getElementById('quiz').style.display = 'none';
            
            this.currentQuestionIndex++;
            this.inQuiz = false;
            this.gameActive = true;
            
            // Đẩy xe ra
            this.car.mesh.position.x += Math.sin(this.car.angle) * 3;
            this.car.mesh.position.z += Math.cos(this.car.angle) * 3;
            this.car.speed = 0.05;
            
            this.justAnswered = true;
            setTimeout(() => { this.justAnswered = false; }, 800);
        }, 2000); 
    }

    updateScoreUI() {
        const scoreElem = document.getElementById('scoreDisplay');
        if(scoreElem) {
            scoreElem.innerText = `${this.score}/${this.totalQuestions}`;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 1. CẬP NHẬT LOGIC VÀ VA CHẠM TRƯỚC TIÊN
        this.updateLogic();
        this.checkCollisions(); // Chuyển lên đây để tính toán xong xuôi mới vẽ

        // Đảm bảo không bị tự động xóa đè layer
        this.renderer.autoClear = false;
        this.renderer.clear();

        // 2. VẼ MÀN HÌNH CHÍNH CỦA NGƯỜI CHƠI
        this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.renderer.setScissorTest(false);
        this.renderer.render(this.scene, this.camera);

        // 3. VẼ MINIMAP ĐÈ LÊN TRÊN
        if (this.isMapExpanded) {
            this.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
            this.renderer.setScissorTest(true);
            this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
            this.renderer.render(this.scene, this.mapCamera);
        } else {
            const mapSize = 200;
            this.renderer.setScissor(window.innerWidth - mapSize - 20, 20, mapSize, mapSize);
            this.renderer.setScissorTest(true);
            this.renderer.setViewport(window.innerWidth - mapSize - 20, 20, mapSize, mapSize);
            this.renderer.render(this.scene, this.mapCamera);
        }
    }

    updateFullMapCamera() {
        const mapWidth = this.world.mapCols * this.world.cellSize;
        const mapHeight = this.world.mapRows * this.world.cellSize;
        
        const padding = 30;
        const targetWidth = mapWidth + padding;
        const targetHeight = mapHeight + padding;

        const aspect = window.innerWidth / window.innerHeight;
        const mapAspect = targetWidth / targetHeight;

        if (aspect > mapAspect) {
            const viewHeight = targetHeight;
            const viewWidth = viewHeight * aspect;
            this.mapCamera.left = -viewWidth / 2;
            this.mapCamera.right = viewWidth / 2;
            this.mapCamera.top = viewHeight / 2;
            this.mapCamera.bottom = -viewHeight / 2;
        } else {
            const viewWidth = targetWidth;
            const viewHeight = viewWidth / aspect;
            this.mapCamera.left = -viewWidth / 2;
            this.mapCamera.right = viewWidth / 2;
            this.mapCamera.top = viewHeight / 2;
            this.mapCamera.bottom = -viewHeight / 2;
        }
        this.mapCamera.updateProjectionMatrix();
    }

    handleGameEnd(isWin) {
        this.gameActive = false;
        if(this.car) this.car.speed = 0;

        const videoContainer = document.getElementById('video-end-container');
        const videoElement = document.getElementById('video-end');
        const okBtn = document.getElementById('btn-ok-end');

        if (videoContainer && videoElement) {
            videoContainer.style.display = 'flex';
            
            let videoPath = '';
            
            if (this.mapId === 2) { 
                videoPath = isWin ? 'assets/video/cvtn_win.mp4' : 'assets/video/cvtn_loss.mp4';
            } else {
                videoPath = isWin ? 'assets/video/uet_win.mp4' : 'assets/video/uet_loss.mp4';
            }
            
            console.log("Playing video:", videoPath);
            videoElement.src = videoPath;
            
            videoElement.load(); 
            videoElement.play();

            okBtn.onclick = () => {
                videoElement.pause();
                videoContainer.style.display = 'none';
                this.showFinalSummary(isWin);
            };
        }
    }

    showFinalSummary(isWin) {
        const summaryOverlay = document.getElementById('summary-overlay');
        const statusTxt = document.getElementById('sum-status');
        const scoreTxt = document.getElementById('sum-score');
        const timeTxt = document.getElementById('sum-time');

        summaryOverlay.style.display = 'block';
        
        const playTimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

        statusTxt.innerText = isWin ? "HOÀN THÀNH 🎉" : "KHÔNG HOÀN THÀNH ❌";
        statusTxt.style.color = isWin ? "#27ae60" : "#e74c3c";
        
        scoreTxt.innerText = `${this.score} / ${this.totalEncounters}`;
        timeTxt.innerText = `${playTimeSeconds} giây`;
    }

    showTrafficWarning(type) {
        const warningBox = document.getElementById('traffic-warning-box');
        const warningImg = document.getElementById('warning-image');

        const images = {
            'RED': 'assets/images/canh_bao_do.jpg',    
            'YELLOW': 'assets/images/canh_bao_vang.jpg' 
        };

        if (warningBox && warningImg) {
            warningImg.src = images[type];
            warningBox.style.display = 'block';

            clearTimeout(this.warningTimeout);
            this.warningTimeout = setTimeout(() => {
                warningBox.style.display = 'none';
            }, 2000);
        }
    }

    // HÀM SPAWN NPC - THẢ XE NPC XUỐNG ĐƯỜNG
    // HÀM SPAWN NPC: BỐC 5 XE/LOẠI VÀ BỎ QUA LỖI THIẾU ẢNH
    spawnNPCs(count) {
        // 1. "LÁ CHẮN" BỎ QUA LỖI THIẾU ẢNH (Bắt buộc phải có để npc1-5 chịu hiện ra)
        const manager = new THREE.LoadingManager();
        manager.setURLModifier((url) => {
            // Nhét tạm 1 pixel ảnh vô hình để Three.js không sập nguồn khi model đòi colormap
            if (url.includes('colormap.png') || url.includes('Textures')) {
                return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; 
            }
            return url;
        });

        // Khởi tạo loader đi kèm lá chắn
        let loader;
        if (typeof GLTFLoader !== 'undefined') { loader = new GLTFLoader(manager); } 
        else if (THREE.GLTFLoader) { loader = new THREE.GLTFLoader(manager); } 
        else { return; }

        // 2. CẤU HÌNH XE VÀ SCALE
        const carConfigs = {
            'car.glb': { scale: 2.0, rotY: 0},
            'car2.glb': { scale: 0.15, rotY: -Math.PI / 2 },
            'banana_car.glb': { scale: 0.01, rotY: 0 },
            'npc1.glb': { scale: 3.0, rotY: 0 }, 
            'npc2.glb': { scale: 3.0, rotY: 0 }, 
            'npc3.glb': { scale: 3.0, rotY: 0 }, 
            'npc4.glb': { scale: 3.0, rotY: 0 },
            'npc5.glb': { scale: 3.0, rotY: 0 } 
        };

        const npcModels = Object.keys(carConfigs);
        let spawnList = [];
        
        // 3. ĐẢM BẢO MỖI LOẠI CÓ ÍT NHẤT 5 CHIẾC
        npcModels.forEach(modelName => {
            for (let i = 0; i < 5; i++) {
                spawnList.push(modelName);
            }
        });

        // Bốc ngẫu nhiên thêm cho đủ tổng số lượng count yêu cầu
        while (spawnList.length < count) {
            const randomModel = npcModels[Math.floor(Math.random() * npcModels.length)];
            spawnList.push(randomModel);
        }

        // Xáo trộn danh sách để xe trên map đa dạng
        spawnList.sort(() => Math.random() - 0.5);

        // 4. TIẾN HÀNH LOAD VÀ THẢ XE
        spawnList.forEach(modelName => {
            loader.load('assets/models/' + modelName, (gltf) => {
                const npcMesh = gltf.scene.clone(); 
                
                // Set kích thước
                const s = carConfigs[modelName].scale;
                npcMesh.scale.set(s, s, s);
                this.scene.add(npcMesh);

                // Tìm vị trí hợp lệ
                let row, col, tile;
                do {
                    row = Math.floor(Math.random() * this.world.mapRows);
                    col = Math.floor(Math.random() * this.world.mapCols);
                    tile = this.world.mapData[row][col];
                } while (![1, 8, 9, 11].includes(tile));

                const config = carConfigs[modelName];
                const npc = new NPCCar(npcMesh, row, col, this.world, config.rotY || 0);
                this.npcCars.push(npc);
            });
        });
    }
    // HÀM KIỂM TRA VA CHẠM
    checkCollisions() {
        if (!this.car || !this.npcCars) return;

        const collisionDistance = 4.0; // Khoảng cách để tính là va chạm (Bạn có thể tăng giảm số này)

        for (let npc of this.npcCars) {
            // Tính khoảng cách giữa xe người chơi và NPC
            const dx = this.car.mesh.position.x - npc.mesh.position.x;
            const dz = this.car.mesh.position.z - npc.mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < collisionDistance) {
                if (Math.abs(this.car.speed) > 0.02) { // Chỉ kêu khi đang di chuyển
                    crashSfx.currentTime = 0; // Reset để có thể phát tiếng liên tục
                    crashSfx.play().catch(e => {}); 
                    }
                // Nếu va chạm -> Đẩy nảy ra
                const bounceForce = 2.5; // Lực nảy
                const nx = dx / distance; // Hướng X để nảy
                const nz = dz / distance; // Hướng Z để nảy

                // Đẩy xe người chơi dội ngược lại
                this.car.mesh.position.x += nx * bounceForce;
                this.car.mesh.position.z += nz * bounceForce;

                // Làm xe người chơi đi chậm lại/lùi lại một chút nếu đang lao tới
                if (this.car.speed > 0) {
                    this.car.speed = -this.car.speed * 0.4; 
                }

                this.showWarningOverlay(); // Gọi hàm hiện cảnh báo
            }
        }
    }

    // HÀM HIỂN THỊ CHỮ CẢNH BÁO
    showWarningOverlay() {
        let warningDiv = document.getElementById('crash-warning');
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.id = 'crash-warning';
            warningDiv.innerText = "OÁI! ĐỤNG XE RỒI!";
            // Làm đẹp cho chữ cảnh báo
            Object.assign(warningDiv.style, {
                position: 'absolute',
                top: '20%', left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#ff3333',
                fontSize: '40px',
                fontWeight: '900',
                fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                textShadow: '3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff',
                pointerEvents: 'none',
                zIndex: '9999',
                display: 'none'
            });
            document.body.appendChild(warningDiv);
        }

        // Hiện chữ lên
        warningDiv.style.display = 'block';

        // Tự động tắt chữ sau 1 giây
        clearTimeout(this.warningTimeout);
        this.warningTimeout = setTimeout(() => {
            warningDiv.style.display = 'none';
        }, 1000);
    }
    
}

window.onload = () => new Game();