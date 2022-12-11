document.addEventListener("keydown", ({ key }) => {
  if (key === "Escape") {
    const delta = new Date("2021-12-31T23:59:19+09:00") - Date.now();
    Date = class extends Date {
      constructor(options) {
        if (options) {
          super(options);
        } else {
          super(Date.now() + delta);
        }
      }
    };
  }
});

const main = async () => {
  const dateDisplay = document.getElementById("date");
  const timeDisplay = document.getElementById("time");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const clock = document.getElementById("clock");
  const clockWrapper = document.getElementById("clock-wrapper");

  const introLength = 41500;
  const pad0 = (n) => ("00" + n).slice(-2);
  const week = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const canvasSize = Math.min(window.innerWidth, window.innerHeight);
  canvas.setAttribute("width", Math.floor(canvasSize));
  canvas.setAttribute("height", Math.floor(canvasSize));

  setInterval(() => {
    const cd = new Date();

    //prettier-ignore
    dateDisplay.textContent
            = `${cd.getFullYear()}-${pad0(cd.getMonth() + 1)}-${pad0(cd.getDate())} ${week[cd.getDay()]}`;

    //prettier-ignore
    timeDisplay.textContent
            = `${pad0(cd.getHours())}:${pad0(cd.getMinutes())}:${pad0(cd.getSeconds())}`;
  }, 100);

  const audioCtx = new AudioContext();
  audioCtx.resume();
  const audioBuffer = await fetch("unicorn.mp3")
    .then((res) => res.arrayBuffer())
    .then((arrBuf) => audioCtx.decodeAudioData(arrBuf));
  const bufferSrc = audioCtx.createBufferSource();
  bufferSrc.buffer = audioBuffer;
  const analyser = audioCtx.createAnalyser();

  bufferSrc.connect(analyser);
  analyser.connect(audioCtx.destination);

  analyser.fftSize = 512;

  const bufferLen = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLen);
  const minFreq = 80;
  const maxFreq = 130;
  const freqCount = maxFreq - minFreq + 1;
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#aaaaaa";
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.floor(canvasSize / 6);
  const binMaxLen = Math.floor(canvasSize / 3);

  const renderFrame = () => {
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    for (let i = 0; i < freqCount; i++) {
      const freq = minFreq + i;
      const theta = (Math.PI * i) / (freqCount - 1);
      const thetaDelta = Math.PI / 4;
      const binLen = (dataArray[freq] * binMaxLen) / 255;

      ctx.moveTo(
        Math.floor(centerX + radius * Math.cos(theta + thetaDelta)),
        Math.floor(centerY + radius * Math.sin(theta + thetaDelta))
      );
      ctx.lineTo(
        Math.floor(centerX + (radius + binLen) * Math.cos(theta + thetaDelta)),
        Math.floor(centerY + (radius + binLen) * Math.sin(theta + thetaDelta))
      );

      ctx.moveTo(
        Math.floor(centerX + radius * Math.cos(-theta + thetaDelta)),
        Math.floor(centerY + radius * Math.sin(-theta + thetaDelta))
      );
      ctx.lineTo(
        Math.floor(centerX + (radius + binLen) * Math.cos(-theta + thetaDelta)),
        Math.floor(centerY + (radius + binLen) * Math.sin(-theta + thetaDelta))
      );
    }
    ctx.closePath();
    ctx.stroke();

    requestAnimationFrame(renderFrame);
  };

  const newYearDate = new Date().setHours(24, 0, 0, 0);
  const newYearDiff = newYearDate - new Date();
  const startDiff = newYearDiff - introLength;

  setTimeout(() => {
    bufferSrc.start();
  }, startDiff);

  setTimeout(() => {
    clock.classList.add("transam");
    clockWrapper.classList.add("transam");
    ctx.strokeStyle = "#000";
  }, newYearDiff);

  renderFrame();
};

document.querySelector("body").onclick = async function () {
  this.onclick = null;
  await main();
};
