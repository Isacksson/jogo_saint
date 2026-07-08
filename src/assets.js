// Carregador de assets: as imagens do Ninja Adventure Pack (CC0, por Pixel-boy)

export const images = {};

const FILES = {
  tileset: 'assets/tileset.png',
  jorge: 'assets/jorge.png',
  sabra: 'assets/sabra.png',
  teodoro: 'assets/teodoro.png',
  anastacio: 'assets/anastacio.png',
  mira: 'assets/mira.png',
  espirito: 'assets/espirito.png',
  imundo: 'assets/imundo.png',
  serpe: 'assets/serpe.png',
  golgor: 'assets/golgor.png',
  amon: 'assets/amon.png',
  dragao: 'assets/dragao.png',
  invejoso: 'assets/invejoso.png',
  leviata: 'assets/leviata.png',
  luzia: 'assets/luzia.png',
  coin: 'assets/coin.png',
  potion: 'assets/potion.png',
  key: 'assets/key.png',
  fireball: 'assets/fireball.png',
  arrow: 'assets/arrow.png',
  fxSlash: 'assets/fx_slash.png',
  fxHeavy: 'assets/fx_heavy.png',
  fxHit: 'assets/fx_hit.png',
};

export function loadAssets() {
  return Promise.all(
    Object.entries(FILES).map(([key, src]) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { images[key] = img; resolve(); };
      img.onerror = () => reject(new Error('Falha ao carregar ' + src));
      img.src = src;
    }))
  );
}
