// Khai báo các biến toàn cục
let camera, scene, renderer, cssRenderer, controls;
const objects = []; 
// targets.helix bây giờ chứa bố cục Tam Giác duy nhất
const targets = { table: [], sphere: [], helix: [], grid: [] }; 

// Hằng số kích thước (Kích thước khối * 100)
const SIZE = 100; 

// Chuyển đổi mảng dữ liệu phẳng thành mảng đối tượng có cấu trúc
const elements = [];
// Mảng 'table' được lấy từ file elements_data.js
// (Tôi giả định file elements_data.js đã được tải)
for (let i = 0; i < table.length; i += 5) {
    const object = {
        symbol: table[i],
        name: table[i + 1],
        mass: table[i + 2],
        x: table[i + 3],
        y: table[i + 4]
    };
    elements.push(object);
}

init();
animate();

// --- BẮT ĐẦU HÀM TẠO HÌNH DẠNG MỚI (Tam Giác Xếp Thứ Tự) ---

/**
 * Tạo vị trí 3D cho hình Tam Giác Cân lớn, xếp theo thứ tự nguyên tử (1 -> 118).
 * @param {number} count Số lượng phần tử cần đặt (tất cả 118 nguyên tố).
 * @returns {Array<{x: number, y: number, z: number}>} Mảng vị trí.
 */
function getTrianglePositions(count) {
    const positions = [];
    const D = 350; // Khoảng cách giữa các điểm
    const X_OFFSET = 0; 
    const Y_OFFSET = 1800; // Đẩy lên trên để chứa toàn bộ 118 nguyên tố
    
    let currentRow = 1;
    let elementsPlaced = 0;
    
    // Vòng lặp để tạo các hàng, mỗi hàng tăng 1 phần tử
    while (elementsPlaced < count) {
        // Chiều rộng hàng hiện tại: (số phần tử - 1) * khoảng cách D
        const rowWidth = (currentRow - 1) * D; 
        // Vị trí X bắt đầu để căn giữa hàng (currentRow)
        const startX = X_OFFSET - rowWidth / 2;
        // Vị trí Y (currentRow * D để đẩy xuống từ đỉnh)
        const currentY = Y_OFFSET - currentRow * D;

        for (let i = 0; i < currentRow; i++) {
            if (elementsPlaced >= count) break;

            // Đặt các phần tử trên hàng hiện tại
            positions.push({
                // Vị trí X: startX + i * D
                x: startX + i * D, 
                y: currentY, 
                z: 0 // Tam giác phẳng 2D
            });
            elementsPlaced++;
        }
        currentRow++;
    }
    return positions;
}


// --- KẾT THÚC CÁC HÀM TẠO HÌNH DẠNG MỚI ---


function init() {
    // 1. Cài đặt Scene & Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050518);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    
    // VỊ TRÍ CAMERA 
    camera.position.z = 2800; // Điều chỉnh Z để thấy được tam giác lớn
    camera.position.y = 0;    

    // 2. Cài đặt WebGL Renderer (Cho các khối 3D)
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 3. Cài đặt CSS3D Renderer (Cho các ký hiệu 2D/HTML)
    cssRenderer = new THREE.CSS3DRenderer(); 
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0px';
    document.getElementById('css-container').appendChild(cssRenderer.domElement);

    // 4. TẠO CÁC KHỐI NGUYÊN TỐ (CSS3DObject)
    for (let i = 0; i < elements.length; i++) {
        const item = elements[i];

        // Tạo thẻ div HTML
        const elementDiv = document.createElement('div');
        elementDiv.className = 'element';
        
        // Thêm số nguyên tử (Number)
        const number = document.createElement('div');
        number.className = 'number';
        number.textContent = (i + 1);
        elementDiv.appendChild(number);

        // Thêm ký hiệu (Symbol)
        const symbol = document.createElement('div');
        symbol.className = 'symbol';
        symbol.textContent = item.symbol;
        elementDiv.appendChild(symbol);

        // Thêm chi tiết (Name và Mass)
        const details = document.createElement('div');
        details.className = 'details';
        details.innerHTML = item.name + '<br>' + item.mass;
        elementDiv.appendChild(details);

        // Tạo đối tượng CSS3DObject
        const object = new THREE.CSS3DObject(elementDiv);
        
        // Đặt ngẫu nhiên ban đầu để có hiệu ứng chuyển động đẹp mắt
        object.position.x = Math.random() * 4000 - 2000;
        object.position.y = Math.random() * 4000 - 2000;
        object.position.z = Math.random() * 4000 - 2000;
        scene.add(object);
        objects.push(object);
    }

    // 5. TẠO VỊ TRÍ MỤC TIÊU CHO CÁC BỐ CỤC
    
    // Bố cục TABLE (Bảng tuần hoàn phẳng)
    for (let i = 0; i < elements.length; i++) {
        const item = elements[i];
        const object = new THREE.Object3D();

        object.position.x = (item.x * 320) - 3040; 
        object.position.y = -(item.y * 360) + 1800; 
        
        targets.table.push(object);
    }
    
    // Bố cục SPHERE (Hình cầu)
    const vector = new THREE.Vector3();
    for (let i = 0, l = objects.length; i < l; i++) {
        const phi = Math.acos(-1 + (2 * i) / l);
        const theta = Math.sqrt(l * Math.PI) * phi;
        const object = new THREE.Object3D();
        object.position.setFromSphericalCoords(1500, phi, theta); 

        vector.copy(object.position).multiplyScalar(2);
        object.lookAt(vector);
        targets.sphere.push(object);
    }

    // Bố cục HELIX (Bố cục Tam Giác) - Sử dụng toàn bộ nguyên tố
    const TRIANGLE_COUNT = objects.length; 
    
    // Tạo vị trí cho Tam Giác
    const triangle_positions = getTrianglePositions(TRIANGLE_COUNT);
    
    for (let i = 0, l = objects.length; i < l; i++) {
        const object = new THREE.Object3D();

        // Phần tử cho hình Tam Giác
        const pos = triangle_positions[i];
        object.position.set(pos.x, pos.y, pos.z);
        
        targets.helix.push(object);
    }

    // Bố cục GRID (Khối Lập Phương 3D)
    const gridSpacing = 500; 
    const columns = 10;
    const rows = 8;
    const totalElementsPerLayer = columns * rows; 

    for (let i = 0; i < objects.length; i++) {
        const object = new THREE.Object3D();

        const xIndex = i % columns;
        const yIndex = Math.floor(i / columns) % rows;
        const zIndex = Math.floor(i / totalElementsPerLayer);

        // X: Căn giữa X
        object.position.x = (xIndex * gridSpacing) - ((columns - 1) * gridSpacing / 2); 
        // Y: Căn giữa Y
        object.position.y = -(yIndex * gridSpacing) + ((rows - 1) * gridSpacing / 2); 
        // Z: Căn giữa Z (Sử dụng 4 lớp)
        object.position.z = (zIndex * gridSpacing * 2) - (3 * gridSpacing);

        targets.grid.push(object);
    }


    // 6. Cài đặt Điều khiển
    controls = new THREE.OrbitControls(camera, cssRenderer.domElement);
    controls.minDistance = 500;
    controls.maxDistance = 10000; 
    
    // Bắt đầu với bố cục TABLE (Hình Chữ Nhật)
    transform(targets.table, 2000); 

    // 7. Xử lý Sự kiện Nút
    document.getElementById('table').addEventListener('click', function () { transform(targets.table, 2000); });
    document.getElementById('sphere').addEventListener('click', function () { transform(targets.sphere, 2000); });
    document.getElementById('helix').addEventListener('click', function () { transform(targets.helix, 2000); }); // Bố cục Tam Giác
    document.getElementById('grid').addEventListener('click', function () { transform(targets.grid, 2000); }); 

    // 8. Xử lý thay đổi kích thước cửa sổ
    window.addEventListener('resize', onWindowResize);
}

function transform(targets, duration) {
    // TWEEN: Thư viện chuyển động mượt mà
    TWEEN.removeAll();

    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const target = targets[i];

        // Chuyển động vị trí
        new TWEEN.Tween(object.position)
            .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();

        // Chuyển động xoay (Rotation)
        new TWEEN.Tween(object.rotation)
            .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }

    new TWEEN.Tween(this)
        .to({}, duration * 2)
        .onUpdate(render)
        .start();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update(); // Cập nhật chuyển động TWEEN
    controls.update(); // Cập nhật điều khiển chuột
    render();
}

function render() {
    cssRenderer.render(scene, camera);
}
