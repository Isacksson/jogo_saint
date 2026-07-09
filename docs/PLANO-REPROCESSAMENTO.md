# Plano de Reprocessamento — A Lenda Áurea
### do protótipo v0.1 → v1.0 sobre o GDD v0.2

> **Princípio.** Isto **não é** uma reescrita do zero. O motor, o combate, o loot,
> os saves, o áudio e o Ato I + as 6 fossas da v0.1 foram testados e ficam. Nós
> *reprocessamos por módulos* — elevando qualidade, corrigindo bugs e padronizando —
> e só então construímos a expansão da v0.2 por cima de uma base sólida.

## Como usar este documento (uma sessão de cada vez)

Como temos poucos tokens por sessão e muito trabalho, cada item abaixo é um passo
**pequeno, autocontido, testável e commitável**. Em cada sessão:

1. Abra este arquivo e pegue o **próximo item `[ ]`** do bloco ativo.
2. Faça **só aquele item** (não adiante os próximos).
3. **Teste** no navegador (Chromium headless via Playwright, como já fazemos).
4. **Commit + push** na branch de trabalho.
5. Marque o item como `[x]` aqui, no mesmo commit.

A ordem dos blocos importa: **Bloco A (fundação) vem antes do conteúdo novo**, porque
os padrões criados nele (portais, mapas, diálogo) são reaproveitados por todo o resto.

---

## BLOCO A — Fundação & Qualidade
*Reprocessa o que já existe e cria os padrões que a v0.2 vai reutilizar. Sessões curtas.*

- [x] **A1 — Portais visíveis e reversíveis** *(corrige o bug relatado)* ✔ feito
  Marcador universal para TODO portal (`renderPortals` em `main.js`), desenhado
  depois da escuridão para brilhar através dela: limiar dourado pulsante + setas
  deslizando no sentido da saída (direção inferida pelo formato do portal) +
  rótulo com o nome do destino (`◄ Catacumbas dos Mártires`, `▼ Pântano...`).
  Testado nas catacumbas, na Fossa da Ira e em Silena — voltar já é visível e
  funcional nos dois sentidos.
  - *Observação para A2*: os portais de volta das fossas são alvos pequenos (1×2
    no canto). O marcador resolve a visibilidade; ao refatorar mapas, vale
    aumentar a zona de gatilho desses portais para facilitar o acerto.

- [x] **A2a — Zonas de gatilho dos portais de volta** ✔ feito
  Os portais de volta das fossas eram alvos de 1×2 no canto. Alargados para a
  coluna inteira da sala de entrada (`h: 2 → 5`), então andar para a esquerda de
  qualquer altura da sala já sai. Sem gatilho instantâneo no spawn (que é em x=4).
  Testado em ira/gula/preguiça saindo do meio da sala.

- [x] **A2b — Extração `makeFossa()`** ✔ feito
  As 6 fossas eram copy-paste. Agora uma fábrica `makeFossa(cfg)` monta toda a
  estrutura comum (antecâmara, arena, alcova selada com portões, escada de
  descida, altar, portais, espírito do santo) a partir de poucos parâmetros
  (`floor`, `arenaY`, `alcoveY`, `returnTo`, `descendTo`, `spirit`, `spawns`),
  delegando ao `carve(m, floor)` só a geometria única de cada fossa. Acrescentar
  um novo ponto de entrada (Bloco C) passa a ser trivial.
  - **Verificado sem mudança visível**: diff dos grids de tile gerados (antigo
    vs. novo) → **idênticos nas 6 fossas**; smoke test → cada fossa carrega com
    chefe/espírito/portões/portais corretos, sem erro.

- [x] **BUG — Chefes ressuscitando** ✔ corrigido *(fora do plano original)*
  Ao salvar/recarregar (e no renascer), os chefes reapareciam porque o mapa era
  reconstruído de `spawns`. Agora, ao morrer, chefe/mini-chefe grava
  `flags.defeated[mapId]` e (se abre selo) `flags.sealsBroken[mapId]`; ambos
  persistem no save. Na reconstrução do mapa, chefe já derrotado não renasce e a
  alcova rompida continua aberta. Testado: Amon morto continua morto após reload.

- [x] **A3 — Caixa de diálogo rica** ✔ feito
  Nova `renderDialogue` (`hud.js`): moldura dupla de iluminura, **retrato**
  emoldurado do interlocutor (recorte do alto do sprite), nome com régua,
  **efeito máquina de escrever** (a fala se revela; E completa a linha ou avança),
  **pontos de página** e prompt contextual (`E — pular` / `continuar ▸` / `fechar ✕`).
  Espíritos ganham tratamento próprio (nome e moldura em azul-frio, sprite
  translúcido). Testado com Sabra e o Espírito de São Sebastião.
  - Base pronta para o pregoeiro/editos de Diocleciano da v0.2.

- [x] **A4 — Navegação e orientação** ✔ feito
  `renderPortalCompass`: quando um portal está fora de quadro, uma seta dourada
  na borda da tela aponta para ele (posição pela direção real ao alvo). Só seta,
  sem rótulo (evita corte de texto e colisão com o HUD; o nome completo aparece
  no marcador do chão quando a saída entra em quadro). Topo com folga para não
  bater nas barras. Testado na Fossa da Ira e em Silena (2 saídas simultâneas).

- [x] **A5 — Polish de transição** ✔ feito
  Troca de mapa agora tem fade: ao pisar num portal, o jogo congela e a tela
  escurece (`FADE` 0.24s), a troca de mapa acontece no ponto mais escuro (o corte
  não aparece) e a tela clareia no mapa novo. Testado silena→pântano; o jogo
  volta a responder ao terminar. Casa com o banner do nome do local.

> **Bloco A concluído** (fundação polida). Só resta o **A2b** (`makeFossa`),
> adiado de propósito para ser feito junto com o primeiro capítulo do Bloco C
> que reusar uma fossa. Pronto para começar o **Bloco B** (infra da v0.2).

---

## BLOCO B — Infraestrutura da v0.2
*Sistemas novos exigidos antes de qualquer região nova. Detalhe em `docs/GDD.md` §6.*

- [x] **B1 — Sistema de lança** *(GDD T12)* ✔ feito
      Novo `src/spear.js` com a classe `Spear`: quatro estágios derivados do estado
      (guarnição → reforçada → Ascalon → consagrada) a partir de `reinforce`,
      `forged`, `consecrated`. Cada estágio traduz para **dano** (24 → +3/reforço
      até +15 → 44 forjada → 60 consagrada), **alcance** e **aparência** (tingimento
      + halo dourado). O `Player` ganha `this.spear`; o ataque pesado passou a puxar
      dano/alcance da lança (não mais `HEAVY.dmg`/`reach` fixos) e a escalar por
      `lanceBonus` (nível), independente da espada de loot. `renderLance` reflete o
      estágio. Persistido no save (`spear.toJSON()`/`Spear.from`, retrocompatível
      com saves sem o campo). Ascalon deixou de ser "já dada": só existe via
      `forge()` (fecho do Ato II, C6) e `consecrate()` (Ato III, D1); Rufo chama
      `reinforceOnce()` (B2). Testado: 31/31 asserções de lógica + smoke no navegador
      (carrega sem erro, investida renderiza nos 4 estágios, dano 24→44).
- [x] **B2a — Loja e mercadora Prisca** *(GDD T13, parte 1)* ✔ feito
      Novo `src/economy.js`: classe `Shop` (abas Comprar/Vender, navegação, mensagens
      do mercador), `renderShop` (painel no estilo do inventário), `sellPrice` (revenda
      de loot escalando com valor e raridade) e o registro `VENDORS` com **Prisca**.
      Prisca vende poções e compra o equipamento de loot da bolsa. NPC ganha campo
      `vendor`; `tryInteract` abre a loja em vez de diálogo; novo ramo de estado no
      loop (mundo congela como no inventário, ←/→ aba · ↑/↓ item · E negocia · I/Esc
      sai). Prisca posta na praça de Silena. `window.enterMap` exposto para testes.
      Fragmentos e milagres nunca entram na loja (não-vendáveis por construção).
      Testado: 13/13 asserções (lógica + render nas 3 telas) + integração no jogo
      (abre perto da Prisca, comprar debita ouro e dá poção).
- [x] **B2b — Ferreiro Rufo e fragmentos** *(GDD T13, parte 2)* ✔ feito
      **Rufo** entra em `VENDORS` como ferreiro (`reforge: true`): a aba de compra
      ganha o serviço "Reforçar a lança", que chama `spear.reinforceOnce()` com preço
      crescente (`reinforceCost` = 40 → 180). O serviço se autodesabilita no limite
      (+5) e na lança já forjada (Ascalon não aceita reforços), sem cobrar. Rufo
      posto em Silena. Novo `src/fragments.js`: registro dos 7 **fragmentos de
      Ascalon** (relíquia por santo), `grantFragment`/`fragmentCount`/`hasAllFragments`
      (a serem concedidos pelos santos no Bloco C e consumidos na forja em C6). O
      inventário passa a exibir o estágio da lança e o progresso `N/7` dos fragmentos.
      Testado: 10/10 (fragmentos, Node) + 14/14 (economia do Rufo + render, navegador)
      + integração no jogo (reforço debita ouro e sobe o dano 24→27; inventário
      renderiza com fragmentos).

- [x] **B3 — Estradas do Império** *(GDD T14)* ✔ feito
      Novo `src/roads.js`: registro `NODES` com os 8 destinos (Capadócia e Silena
      abertos; os 6 hubs do Bloco C fechados até `flags.roads[id] = true`, persistido
      no save), arestas na ordem da história, `RoadsScreen` (seleção, recusa de
      destino fechado com aviso) e `renderRoads` (pergaminho com nós, estradas
      pontilhadas, marcador ✝ "estás aqui", descrição de cada região). Entrada por
      um portal novo `roads: true` na encruzilhada leste de Silena (estrada estendida
      até a borda); `checkPortals` abre a tela em vez de trocar de mapa e recua o
      cavaleiro um passo (fechar não reabre). Viajar reusa o fade do A5. Cada hub
      do Bloco C só precisa gravar a flag e preencher `dest`.
      Testado (integração + screenshot): abre ao pisar na encruzilhada, recusa
      Forte Sebaste fechado, viaja a Capadócia no nó certo, sem erros.
- [x] **B4 — Anjo da Guarda** *(GDD T14b)* ✔ feito
      Novo `src/angel.js`: o companheiro celeste concedido por **São Miguel** (novo
      NPC-espírito no Prólogo da Capadócia, via `grantFlag: 'anjo'` — mecanismo
      genérico de dom não-milagre no fim do diálogo). A patente é **derivada das
      bênçãos** (`angelRank(flags)`): Anjo → Arcanjo → Principado → Virtude →
      Potestade → Domínio → Serafim, com promoção anunciada em jogo. Comportamento:
      órbita suave junto a Jorge; ataca sozinho o inimigo mais próximo (raio de luz,
      dano 4+2/patente a cada 2,2 s); da **Virtude** em diante cura 1,5 hp/s; o
      **Serafim** ganha o socorro (escudo + invulnerabilidade 2,5 s quando a vida
      cai de 25%, recarga 45 s). Visual procedural: brilho que cresce com a patente,
      1–3 pares de asas, auréola da Potestade em diante; desenhado por cima da
      escuridão (é uma luz). Nada novo no save: posse e patente vivem em `flags`.
      Testado (integração): o diálogo concede o dom; inimigo perde vida sozinho
      (30→22); promovido a Virtude, cura (50→53 em 2 s); Serafim dispara o socorro
      (invuln + escudo + recarga armada). Screenshot ok, sem erros.

> **Bloco B concluído** (lança, economia, estradas, anjo). A infraestrutura da
> v0.2 está pronta — o próximo passo é o **Bloco C** (C1 — Forte Sebaste).

---

## BLOCO C — Conteúdo da v0.2
*Cada capítulo = região de superfície + a fossa já existente + instrumento. ~2 sessões
cada. Segue o roadmap do GDD §6 (T15–T26); as fossas são reaproveitadas, não refeitas.*

- [x] **C1a — Forte Sebaste + reentrada na Fossa da Ira** *(GDD T15–T16, parte 1)* ✔ feito
      Novo mapa `sebaste` (guarnição murada em pedra, casernas, pátio): chega-se
      pelas **Estradas** (o nó abre quando `dragaoDerrotado`; Sabra aponta o caminho).
      **Quest do soldado preso**: o Pregoeiro lê o 1º edito de Diocleciano; Cassiano
      conta que Marcelino foi preso; o **Carcereiro Possesso** (mini-chefe `keyCarrier`
      generalizado: `keyFlag`/`keyLabel`, chave e portão agora suportam múltiplos
      mapas) guarda as chaves; abrir o cárcere liberta Marcelino (`sebasteLivre`,
      persistente), que aponta o **poço velho** — nova entrada da Fossa da Ira
      (`extraPortals` no `makeFossa`), com portal de volta ao forte. Rufo e Prisca
      presentes no hub. **Fragmentos ativados**: toda bênção de santo agora entrega
      também o fragmento de Ascalon correspondente (`MIRACLE_FRAGMENT`, para todos
      os capítulos de uma vez). Testado (integração + screenshot): viagem, quest
      completa (chave→cárcere→Marcelino), poço→fossa com 3 portais, bênção de
      Sebastião concede Chuva de Setas + Farpa da Flecha. Sem erros.
- [x] **C1b — Corda de Sebastião + Cavaleiro Guerra** *(GDD T15–T16, parte 2)* —
      **`instruments.js` novo**: os 7 instrumentos registrados de uma vez, posse
      DERIVADA de `flags.milagres` (zero campos de save, retroativo; anunciado
      na bênção junto do fragmento). **Corda (tecla R)**: com estaca-âncora
      alinhada ao olhar (≤330 px), Jorge se lança por sobre lava/fossos (estado
      `grapple`, invulnerável); sem âncora, laça o inimigo mais próximo (≤240 px)
      e o imobiliza 2 s (`bindT`, IA congela como no atordoamento da Luz; cd
      4,5 s; funciona até em chefes). Na Fossa da Ira: saliência com 2 âncoras
      + **tesouros de mapa** (`def.treasures`, coleta única via `flags.tesouros`)
      — 90 denários + Relicário do Mártir. **Cavaleiro Guerra**: viajar a
      Sebaste sem vencê-lo desvia para o mapa novo `estrada_sebaste`; saída
      leste com `portal.locked(flags)` (novo, com pushback + aviso) até ele cair;
      ao "morrer" se dissolve prometendo voltar (`flags.cavaleiros.guerra`,
      GDD §2.6) — render: sprite de Jorge tingido de vermelho + aura (sem asset
      novo). Testado (integração, 14 asserções + 2 screenshots): emboscada,
      laço, bloqueio, dissolução, travessia e tesouro. Sem erros.
- [ ] **C2 — Porto de Luzia** + Fossa da Inveja + Espelho de Luzia + Cavaleiro Conquista. *(T17–T18)*
- [ ] **C3 — Ermo de Antão** + Fossa da Gula + Cajado de Antão. *(T19–T20)*
- [ ] **C4 — Distrito do Tesouro** (revisita) + Fossa da Avareza + Balança de Lourenço
      + Cavaleiro Fome. *(T21–T22)*
- [ ] **C5 — Vila do Jardim de Inês** + Fossa da Luxúria + Grinalda de Inês. *(T23–T24)*
- [ ] **C6 — Mosteiro de Núrsia** + Fossa da Preguiça + Sino de Bento + Cavaleiro Morte
      + **cena da forja de Ascalon** (fecho do Ato II). *(T25–T26)*

---

## BLOCO D — Ato III e Fecho
- [ ] **D1 — Portas do Abismo** — mapa final + Quatro Cavaleiros como arauto +
      Serpente Antiga fases 1–2. *(GDD T27)*
- [ ] **D2 — Nicomédia e a Tentação** — eco final de Diocleciano, fase 3 da Serpente,
      epílogo das rosas, créditos. *(GDD T28)*
- [ ] **D3 — Balanceamento e polish final** — curva de dano/vida/preços, tela de vitória. *(GDD T29)*

---

## Já pronto na v0.1 (mantido e reaproveitado)

Motor (game loop, input, câmera, colisão) · combate em tempo real (combo, lança,
esquiva, Fúria) · loot com raridades, inventário, XP/níveis, altares/save ·
Ato I completo (Capadócia → Silena → Pântano → Catacumbas, quest da chave, Dragão) ·
as **6 fossas** com príncipes e os **7 milagres** dos santos · áudio Web Audio ·
tela de título · arte do Ninja Adventure Pack (CC0).

Estes sistemas são a fundação; o reprocessamento os pole e a v0.2 os expande.
