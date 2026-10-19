/* Il Fredolin · protótipo da Alternativa B (§11): o laço de tempo do heatSim (condução 1-D na esfera, capacidade
   aparente com calor latente, borda convectiva) compilado para WebAssembly pelo LLVM (clang 18, o mesmo backend
   do Rust). Não vai para o app: serve para medir ganho de velocidade e diferença numérica contra o JavaScript.
   Mesma discretização, mesma tabela de propriedades e mesmo passo do heatSim (src/core/heat-transfer/pote.js). */
#define MAXN 64
#define MAXT 512
#define MAXC 40000
static double cap[MAXT], kk[MAXT], vol[MAXN], area[MAXN], Tn[MAXN], q[MAXN], curve[MAXC * 4];
double *p_cap(void) { return cap; }
double *p_kk(void) { return kk; }
double *p_curve(void) { return curve; }
static inline int ix(double T, double TL, double TS, int NT) {
  int i = (int)__builtin_floor((T - TL) / TS + .5);                  /* = Math.round do JavaScript */
  return i < 0 ? 0 : i >= NT ? NT - 1 : i;
}
/* devolve o número de pontos gravados na curva (t em min, camada de servir, centro, superfície) */
int run(int N, double r, double rho, double h, double T0, double Tamb, double tMax, double step, double dtMaxIn,
        double TL, double TS, int NT, double scoopDepth) {
  const double PI = 3.141592653589793;
  double dr = r / N, scoopV = 0; int s0 = N;
  for (int i = 0; i < N; i++) {
    double a = (i + 1) * dr, b = i * dr;
    vol[i] = 4.0 / 3.0 * PI * (a * a * a - b * b * b); area[i] = 4 * PI * a * a; Tn[i] = T0;
    if (a > r - scoopDepth + 1e-9) { if (i < s0) s0 = i; scoopV += vol[i]; }
  }
  int nc = 0; curve[0] = 0; curve[1] = T0; curve[2] = T0; curve[3] = T0; nc = 1;
  double t = 0, next = step;
  while (t < tMax) {
    double dtMax = dtMaxIn;
    for (int i = 0; i < N; i++) {
      int j = ix(Tn[i], TL, TS, NT); double kc = kk[j], C = rho * cap[j] * vol[i], G = 0;
      if (i < N - 1) G += (kc + kk[ix(Tn[i + 1], TL, TS, NT)]) / 2 * area[i] / dr;
      if (i > 0) G += (kc + kk[ix(Tn[i - 1], TL, TS, NT)]) / 2 * area[i - 1] / dr;
      if (i == N - 1) G += 1 / (dr / 2 / (kc * area[i]) + 1 / (h * area[i]));
      double lim = .45 * C / G; if (lim < dtMax) dtMax = lim;
    }
    double dt = dtMax > .05 ? dtMax : .05;
    for (int i = 0; i < N; i++) {
      double kc = kk[ix(Tn[i], TL, TS, NT)], f = 0;
      if (i < N - 1) f += (kc + kk[ix(Tn[i + 1], TL, TS, NT)]) / 2 * area[i] / dr * (Tn[i + 1] - Tn[i]);
      if (i > 0) f += (kc + kk[ix(Tn[i - 1], TL, TS, NT)]) / 2 * area[i - 1] / dr * (Tn[i - 1] - Tn[i]);
      if (i == N - 1) f += (Tamb - Tn[i]) / (dr / 2 / (kc * area[i]) + 1 / (h * area[i]));
      q[i] = f;
    }
    for (int i = 0; i < N; i++) Tn[i] += q[i] * dt / (rho * cap[ix(Tn[i], TL, TS, NT)] * vol[i]);
    t += dt;
    if (t >= next && nc < MAXC) {
      double sc = 0; for (int i = s0; i < N; i++) sc += Tn[i] * vol[i];
      curve[nc * 4] = t / 60; curve[nc * 4 + 1] = sc / scoopV; curve[nc * 4 + 2] = Tn[0]; curve[nc * 4 + 3] = Tn[N - 1]; nc++;
      next += step;
    }
  }
  return nc;
}
