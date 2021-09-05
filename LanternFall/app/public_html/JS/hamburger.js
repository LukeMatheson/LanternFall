let tl = anime.timeline({
    targets: ".ham-container",
    easing: 'easeOutCirc',
    duration: 300,
    opacity: [0, 1],
    width: '210px',
    autoplay: false
  })
  .add({
    delay: 100
  })
  .add({
    targets: ".float-top, .float-bot",
    color: "#18b418",
    translateX: [-100, 0],
    opacity: [0, 1],
    delay: anime.stagger(40)
  })
  .add({
      targets: "a",
      color: "#18b418",
      duration: 150
  });

  document.getElementById("btnHam").addEventListener("click", () => {
    tl.play() ;
    tl.finished.then(() => {
        tl.reverse() ;
    }) ;
  });