export class Car {
    constructor(scene, startX, startZ) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.scene.add(this.mesh);

        // 1. Tạo nhóm chứa mũi tên
        this.arrowGroup = new THREE.Group();

        // 2. Tạo hình nón làm đầu mũi tên
        const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Màu vàng
        const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);

        // Xoay hình nón nằm ngang để hướng đỉnh về phía trước (trục Z)
        arrowMesh.rotateX(Math.PI / 2);
        arrowMesh.position.set(0, 5, 0); // Đặt mũi tên cao hơn xe 5 đơn vị

        this.arrowGroup.add(arrowMesh);
        this.mesh.add(this.arrowGroup); // Gắn mũi tên vào xe

        this.speed = 0;
        this.angle = 0;
        this.radius = 2.0;

        this.loadModel(startX, startZ);
    }

    loadModel(startX, startZ) {
        // --- LẤY MÀU XE TỪ LOBBY (GARAGE) ---
        const savedBodyColor = localStorage.getItem('carBodyColor') || '#00aa00';
        const savedDetailsColor = localStorage.getItem('carDetailsColor') || '#8A2BE2';

        // Lấy tên xe đã chọn
        let selectedCarModel = localStorage.getItem('selectedCarModel') || 'car.glb';

        // 👉 CHỐT CHẶN: Ép chuẩn tên xe chuối phòng trường hợp ngoài sảnh lưu khác tên
        if (selectedCarModel === 'banana car.glb' || selectedCarModel === 'bananaCar') {
            selectedCarModel = 'banana_car.glb';
        }

        // Tạo chất liệu (Material) từ màu đã lấy
        const myBodyMaterial = new THREE.MeshStandardMaterial({ color: savedBodyColor, roughness: 0.3 });
        const myDetailsMaterial = new THREE.MeshStandardMaterial({ color: savedDetailsColor, roughness: 0.5 });

        // --- MANG CUỐN SỔ TAY VÀO ---
        const carConfigs = {
            'car.glb': {
                bodyParts: ['Object_4', 'Object_7'],
                wheelParts: ['Object_14'],
                scale: 2.0,
                rotationY: 0 
            },
            'car2.glb': {
                bodyParts: ['Cabine_1_0'],
                wheelParts: ['Weel_low_1_0'],
                scale: 0.15,
                rotationY: -Math.PI / 2 
            },
            // 👉 BỔ SUNG CẤU HÌNH XE CHUỐI VÀO SỔ TAY:
            'banana_car.glb': {
                bodyParts: ['Object_2', 'Object_3', 'body'], 
                wheelParts: ['Object_4', 'Object_5', 'Object_6', 'tire', 'tire_2', 'tire_3'], 
                scale: 0.01, 
                rotationY: 0 
            }
        };

        // Lấy cấu hình ra
        const config = carConfigs[selectedCarModel];

        // --- TẢI ĐÚNG CHIẾC XE ---
        const loader = new THREE.GLTFLoader();

        loader.load(
            'assets/models/' + selectedCarModel, 
            (gltf) => {
                const myCar = gltf.scene;
                
                // 👉 BẢO VỆ CHỐNG LỖI SẬP GAME
                if (config) {
                    // Áp dụng kích thước và góc xoay từ sổ tay
                    myCar.scale.set(config.scale, config.scale, config.scale);
                    myCar.rotation.y = config.rotationY;
                } else {
                    console.warn("⚠️ Không tìm thấy cấu hình cho xe: ", selectedCarModel);
                }

                myCar.traverse((child) => {
                    if (child.isMesh && config) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Đổ màu dựa theo cấu hình của đúng chiếc xe đó
                        if (config.bodyParts.includes(child.name)) { 
                            child.material = myBodyMaterial; 
                        }
                        if (config.wheelParts.includes(child.name)) { 
                            child.material = myDetailsMaterial; 
                        }
                    }
                });

                // Gắn chiếc xe 3D vào trong Group của class này
                this.mesh.add(myCar);
                
                // Cài đặt vị trí xuất phát cho xe
                this.mesh.position.set(startX, 0, startZ);
            }, 
            undefined, // Callback đang tải
            (error) => { // Callback báo lỗi
                console.error("Lỗi khi tải model xe:", error);
                const box = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({color: 0x3498db}));
                box.position.y = 1; 
                this.mesh.add(box);
                this.mesh.position.set(startX, 0, startZ);
            }
        );
    }

    updateArrow(target) {
        if (target) {
            this.arrowGroup.position.set(
                this.mesh.position.x,
                8,
                this.mesh.position.z
            );

            this.arrowGroup.lookAt(target.x, 8, target.z);
        }
    }
}

// NPC Car 
export class NPCCar {
    constructor(mesh, startRow, startCol, world, baseRotation = 0) {
        this.mesh = mesh;
        this.world = world;
        this.baseRotation = baseRotation; 
        
        this.currentRow = startRow;
        this.currentCol = startCol;
        this.targetRow = startRow;
        this.targetCol = startCol;

        this.maxSpeed = 10; 
        this.speed = 10; 
        this.radius = 1.8; // Bán kính va chạm (tăng một chút để xe chuối không lọt vào quá sâu)
        
        // Dùng để xử lý lực dội ngược khi va chạm
        this.reboundVelocity = new THREE.Vector3(0, 0, 0);
        
        this.dirX = 0;
        this.dirZ = 0;

        this.mesh.position.set(
            this.currentCol * this.world.cellSize + this.world.offsetX,
            0.5, 
            this.currentRow * this.world.cellSize + this.world.offsetZ
        );

        this.pickNextTarget();
    }

    // 1. SỬA LẠI HÀM isRoad ĐỂ XE DÁM ĐI VÀO NGÃ TƯ
    isRoad(row, col) {
        if (row < 0 || row >= this.world.mapRows || col < 0 || col >= this.world.mapCols) return false;
        const tile = this.world.mapData[row][col];
        // 👉 ĐÃ THÊM: 67 (Ngã tư), 50, 51 (Đích đến) vào danh sách đường đi hợp lệ
        return [1, 8, 9, 11, 67, 50, 51].includes(tile); 
    }

    // 2. NÂNG CẤP HÀM CHỌN MỤC TIÊU (ƯU TIÊN ĐI THẲNG)
    pickNextTarget() {
        const possibleMoves = [];
        let forwardMove = null; // Biến ghi nhớ hướng đi thẳng

        const directions = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];
        for (let dir of directions) {
            const nextR = this.currentRow + dir.r;
            const nextC = this.currentCol + dir.c;
            
            // Bỏ qua hướng đi lùi trực tiếp
            if (dir.r === -this.dirZ && dir.c === -this.dirX && (this.dirX !== 0 || this.dirZ !== 0)) continue;
            
            if (this.isRoad(nextR, nextC)) {
                possibleMoves.push(dir);
                // Nếu hướng này trùng với hướng đang đi -> Đây là hướng đi thẳng
                if (dir.r === this.dirZ && dir.c === this.dirX) {
                    forwardMove = dir;
                }
            }
        }

        if (possibleMoves.length > 0) {
            let move;
            // 👉 THUẬT TOÁN LÁI XE THÔNG MINH:
            // Cho tỷ lệ 85% xe sẽ giữ nguyên làn và đi thẳng nếu phía trước vẫn là đường.
            // Điều này dẹp loạn tình trạng xe lạng lách sang làn bên cạnh hoặc đi hình vuông.
            if (forwardMove && Math.random() < 0.85) {
                move = forwardMove;
            } else {
                // Chỉ rẽ khi hết đường thẳng, hoặc xui xui rơi vào 15% ngẫu nhiên đổi làn/rẽ ở ngã tư
                move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            }

            this.dirZ = move.r; 
            this.dirX = move.c;
            this.targetRow = this.currentRow + move.r;
            this.targetCol = this.currentCol + move.c;
            this.mesh.rotation.y = Math.atan2(this.dirX, this.dirZ) + this.baseRotation; 
        } else {
            // Quay đầu 180 độ nếu bị dồn vào ngõ cụt
            this.dirX = -this.dirX; 
            this.dirZ = -this.dirZ;
            this.targetRow = this.currentRow + this.dirZ;
            this.targetCol = this.currentCol + this.dirX;
            this.mesh.rotation.y = Math.atan2(this.dirX, this.dirZ) + this.baseRotation; 
        }
    }

    // XỬ LÝ VA CHẠM MƯỢT MÀ, ÊM ÁI
    handleCollision(deltaTime, playerCar) {
        if (!playerCar || !playerCar.mesh) return;

        const dist = this.mesh.position.distanceTo(playerCar.mesh.position);
        const minDist = this.radius + (playerCar.radius || 2.0); // Xe chuối bán kính to hơn chút

        if (dist < minDist) {
            // 1. Thuật toán đẩy (để không bị kẹt, giữ nguyên nhưng đẩy nhẹ hơn)
            const overlap = minDist - dist;
            const pushVec = new THREE.Vector3()
                .subVectors(this.mesh.position, playerCar.mesh.position)
                .normalize()
                .multiplyScalar(overlap);
            this.mesh.position.add(pushVec);

            // 2.  Phép thuật chính: Tính toán vector dội ngược (Reflect)
            // Lấy hướng va chạm
            const collisionNormal = new THREE.Vector3()
                .subVectors(this.mesh.position, playerCar.mesh.position)
                .normalize();

            // Tính vector tốc độ hiện tại của NPC
            const currentVelocity = new THREE.Vector3(this.dirX, 0, this.dirZ).multiplyScalar(this.speed);

            // Phản chiếu tốc độ qua hướng va chạm (Reflect formula: V_new = V - 2 * (V dot N) * N)
            const dot = currentVelocity.dot(collisionNormal);
            const reboundVec = currentVelocity.clone().sub(collisionNormal.multiplyScalar(2 * dot));

            // Set lực dội ngược, giảm tốc độ đi 1 chút để tạo độ nhún (ví dụ còn 0.4 lực)
            this.reboundVelocity.copy(reboundVec).multiplyScalar(0.4);
            
            // Giảm tốc độ chính của NPC về 0 để lực dội ngược làm việc
            this.speed = 0;
        }
    }

    update(deltaTime, playerCar, allNPCs = []) { 
        // 1. Xử lý va chạm với xe người chơi
        if (this.handleCollision) this.handleCollision(deltaTime, playerCar);
        if (this.reboundVelocity) {
            this.reboundVelocity.multiplyScalar(0.92);
            this.mesh.position.add(this.reboundVelocity.clone().multiplyScalar(deltaTime));
        }
        if (this.speed <= 0 && this.reboundVelocity && this.reboundVelocity.length() > 0.2) return; 

        // 2. Xác định mục tiêu đang đi tới
        const targetX = this.targetCol * this.world.cellSize + this.world.offsetX;
        const targetZ = this.targetRow * this.world.cellSize + this.world.offsetZ;

        // Tính hướng đi hiện tại của xe (Vector chỉ đường)
        let dx = targetX - this.mesh.position.x;
        let dz = targetZ - this.mesh.position.z;
        let distance = Math.sqrt(dx * dx + dz * dz);

        let forwardX = distance > 0 ? dx / distance : 0;
        let forwardZ = distance > 0 ? dz / distance : 0;

        // =======================================================
        // 🚦 AI LÁCH XE THÔNG MINH (TRÁNH SANG BÊN PHẢI)
        // =======================================================
        let dodgeForceX = 0;
        let dodgeForceZ = 0;
        let isDodging = false;

        if (allNPCs && allNPCs.length > 0) {
            for (let other of allNPCs) {
                if (other === this) continue;

                const dist = this.mesh.position.distanceTo(other.mesh.position);

                // Nếu có xe lọt vào vùng quét radar (khoảng cách 4.5)
                if (dist < 4.5 && dist > 0.1) {
                    // Xác định xe kia nằm ở đâu so với mình
                    const toOtherX = (other.mesh.position.x - this.mesh.position.x) / dist;
                    const toOtherZ = (other.mesh.position.z - this.mesh.position.z) / dist;

                    // Tính góc nhìn: Xe kia có đang chặn đầu mình không?
                    const dotProduct = forwardX * toOtherX + forwardZ * toOtherZ;

                    // Nếu xe kia ở PHÍA TRƯỚC mặt mình (chặn đầu)
                    if (dotProduct > 0.3) {
                        isDodging = true;

                        // 👉 TÌM HƯỚNG "BÊN PHẢI" CỦA XE ĐỂ LÁCH
                        // Theo toán học, vector vuông góc bên phải của (X, Z) là (Z, -X)
                        const rightX = forwardZ;
                        const rightZ = -forwardX;

                        // Lực bẻ lái (Càng sát nhau thì đánh lái càng gắt)
                        const dodgeStrength = (4.5 - dist) * 5.0;

                        dodgeForceX += rightX * dodgeStrength;
                        dodgeForceZ += rightZ * dodgeStrength;
                    }
                }
            }
        }

        // ==================== Phanh khi gặp HỆ THỐNG ĐÈN GIAO THÔNG ====================
        const currentTile = this.world.mapData[this.currentRow][this.currentCol];
        const nextTile = this.world.mapData[this.targetRow][this.targetCol];

        // Nếu ô tiếp theo là ngã tư (67), ô hiện tại không phải ngã tư, VÀ đèn không xanh
        const isApproachingRedLight = (nextTile === 67 && currentTile !== 67 && this.world.trafficLightStatus !== "GREEN");

        if (isApproachingRedLight) {
            // Đạp phanh khẩn cấp trước vạch kẻ đường!
            this.speed = 0; 
        } else {
            // Đường thông thoáng hoặc đang ở giữa ngã tư -> tiếp tục di chuyển
            // Nếu đang phải lách xe, đi chậm lại một xíu (80% tốc độ) để lách cho chuẩn
            this.speed = isDodging ? this.maxSpeed * 0.8 : this.maxSpeed;
        }
        // =================================================================

        // Áp dụng lực đánh lái, trượt xe sang ngang
        this.mesh.position.x += dodgeForceX * deltaTime;
        this.mesh.position.z += dodgeForceZ * deltaTime;

        // Sau khi bị trượt sang ngang, tính toán lại khoảng cách tới đích
        dx = targetX - this.mesh.position.x;
        dz = targetZ - this.mesh.position.z;
        distance = Math.sqrt(dx * dx + dz * dz);
        // =======================================================

        // 3. Tiến thẳng về phía trước
        const moveStep = this.speed * deltaTime;

        if (distance <= moveStep) {
            // Tới giữa ngã tư
            this.mesh.position.x = targetX;
            this.mesh.position.z = targetZ;
            this.currentRow = this.targetRow;
            this.currentCol = this.targetCol;
            if (this.pickNextTarget) this.pickNextTarget();
        } else {
            // Vẫn đang đi
            if (distance > 0) {
                this.mesh.position.x += (dx / distance) * moveStep;
                this.mesh.position.z += (dz / distance) * moveStep;
            }
        }
    }
}
