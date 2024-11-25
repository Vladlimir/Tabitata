const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Фоновое изображение
const backgroundImage = new Image();
backgroundImage.src = 'background.png'; // Укажите путь к вашему изображению фона

// Игрок
const playerImage = new Image();
playerImage.src = 'player.png'; // Укажите путь к вашему изображению игрока

const player = {
    x: 50,
    y: 500,
    width: 30,
    height: 30,
    speed: 5,
    dy: 0,
    gravity: 0.5,
    jumpPower: 10,
    grounded: false
};

// Динамический противник
const enemyImage = new Image();
enemyImage.src = 'enemy.png'; // Укажите путь к вашему изображению противника

// Райден противник
const raidenImage = new Image();
raidenImage.src = 'raiden.png'; // Укажите путь к вашему изображению противника

const movingEnemy = {
    x: 300,
    y: 500,
    width: 30,
    height: 30,
    speed: 2,
    direction: 1 // 1 для движения вправо, -1 для движения влево
};

// Райден
const raiden = {
    x: 450, // Позиция неподвижного противника (например, в правом верхнем углу)
    y: 280, // Высота, на которой он будет находиться
    width: 30,
    height: 30
};

// Звук
const collisionSound = new Audio('tabibitoSan.mp3'); // Укажите путь к вашему звуковому файлу

// Изображение платформы
const platformImage = new Image();
platformImage.src = 'platform.png'; // Укажите путь к вашему изображению платформы

// Изображение для самой нижней платформы
const bottomPlatformImage = new Image();
bottomPlatformImage.src = 'bottom_platform.png'; // Укажите путь к вашему изображению для нижней платформы

// Количество платформ, которые вы хотите создать
const numberOfPlatforms = 10; // Измените это значение по вашему усмотрению
const platformWidth = 150; // Ширина платформы
const platformHeight = 10; // Высота платформы

// Функция для генерации случайных платформ
function generateRandomPlatforms() {
    const newPlatforms = [];
    const usedPositions = new Set();

    for (let i = 0; i < numberOfPlatforms; i++) {
        let x, y;

        // Генерация случайных координат
        do {
            x = Math.floor(Math.random() * (canvas.width - platformWidth));
            y = Math.floor(Math.random() * (canvas.height - 100)); // 100 - это минимальная высота для платформ
        } while (usedPositions.has(`${x},${y}`) || y > canvas.height - 50); // Проверка на пересечение и границы

        usedPositions.add(`${x},${y}`);
        newPlatforms.push({ x: x, y: y, width: platformWidth, height: platformHeight });
    }

    return newPlatforms;
}

// Инициализация платформ
const platforms = [
    { x: 0, y: canvas.height - 50, width: canvas.width, height: 250 }, // Нижняя платформа
    ...generateRandomPlatforms() // Добавляем случайные платформы
];

// Управление
let keys = {};
let gameRunning = true; // Переменная для отслеживания состояния игры
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Камера
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    scale: 1.5 // Увеличьте значение, чтобы приблизить камеру
};

// Максимальная позиция игрока по оси X
const maxPlayerX = 1000 - player.width;

// Получаем элемент видео
const raidenVideo = document.getElementById('raidenVideo');

// Основной игровой цикл
function gameLoop() {
    if (!gameRunning) return; // Если игра не запущена, прекращаем выполнение

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Обновление состояния игры
function update() {
    // Управление движением игрока
    if (keys['ArrowRight']) {
        if (player.x + player.speed < maxPlayerX) {
            player.x += player.speed;
        } else {
            player.x = maxPlayerX; // Установка игрока на границу
        }
    }
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
        if (player.x < 0) {
            player.x = 0; // Установка игрока на левую границу
        }
    }
    if (keys['ArrowUp'] && player.grounded) {
        player.dy = -player.jumpPower;
        player.grounded = false;
    }
    
    // Применение гравитации
    player.dy += player.gravity;
    player.y += player.dy;

    // Проверка на столкновение с платформами
    player.grounded = false;
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height < platform.y + platform.height &&
            player.y + player.height + player.dy > platform.y) {
            player.dy = 0;
            player.y = platform.y - player.height;
            player.grounded = true;
        }
    });

    // Ограничение игрока в пределах канваса
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
    }

    // Обновление позиции камеры
    camera.x = player.x - canvas.width / (2 * camera.scale) + player.width / (2 * camera.scale);
    camera.y = player.y - canvas.height / (2 * camera.scale) + player.height / (2 * camera.scale);
    
    // Ограничение камеры по оси X
    const maxCameraX = Math.max(0, 1000 - canvas.width / camera.scale); // Уровень шириной 1000 пикселей
    if (camera.x < 0) camera.x = 0; // Не позволяем камере выходить за левую границу
    if (camera.x > maxCameraX) camera.x = maxCameraX; // Не позволяем камере выходить за правую границу

    // Обновление движущегося противника
    movingEnemy.x += movingEnemy.speed * movingEnemy.direction;

    // Проверка столкновения движущегося противника с границами платформ
    if (movingEnemy.x < 0 || movingEnemy.x + movingEnemy.width > canvas.width) {
        movingEnemy.direction *= -1; // Изменение направления
    }

    // Проверка столкновения противников с игроком
    if (player.x < movingEnemy.x + movingEnemy.width &&
        player.x + player.width > movingEnemy.x &&
        player.y < movingEnemy.y + movingEnemy.height &&
        player.y + player.height > movingEnemy.y) {
        collisionSound.play(); // Воспроизведение звука при столкновении
        gameRunning = false; // Остановка игры при столкновении
    }

    // Проверка столкновения неподвижного противника с игроком
    if (player.x < raiden.x + raiden.width &&
        player.x + player.width > raiden.x &&
        player.y < raiden.y + raiden.height &&
        player.y + player.height > raiden.y) {
        collisionSound.play(); // Воспроизведение звука при столкновении
        raidenVideo.style.display = 'block'; // Показываем видео
        raidenVideo.play(); // Воспроизводим видео
    }
}

// Отрисовка объектов
function draw() {
    ctx.save(); // Сохраняем текущее состояние контекста
    ctx.scale(camera.scale, camera.scale); // Применяем масштабирование

    // Отрисовка фона
    ctx.drawImage(backgroundImage, -camera.x, -camera.y, canvas.width, canvas.height);

    // Отрисовка платформ с использованием изображения
    platforms.forEach((platform, index) => {
        if (index === 0) { // Если это самая нижняя платформа
            ctx.drawImage(bottomPlatformImage, platform.x - camera.x, platform.y - camera.y, platform.width, platform.height);
        } else {
            ctx.drawImage(platformImage, platform.x - camera.x, platform.y - camera.y, platform.width, platform.height);
        }
    });

    // Отрисовка игрока с использованием изображения
    ctx.drawImage(playerImage, player.x - camera.x, player.y - camera.y, player.width, player.height);

    // Отрисовка движущегося противника с использованием изображения
    ctx.drawImage(enemyImage, movingEnemy.x - camera.x, movingEnemy.y - camera.y, movingEnemy.width, movingEnemy .height);

    // Отрисовка неподвижного противника с использованием изображения
    ctx.drawImage(raidenImage, raiden.x - camera.x, raiden.y - camera.y, raiden.width, raiden.height);

    // Если игра остановлена, отобразить сообщение
    if (!gameRunning) {
        ctx.fillStyle = '#000000';
        ctx.font = '30px Arial';
        ctx.fillText('Вас лишили меча!', (canvas.width / (2 * camera.scale)) - 100, (canvas.height / (2 * camera.scale)));
    }

    ctx.restore(); // Восстанавливаем состояние контекста
}

// Запуск игры
gameLoop();
