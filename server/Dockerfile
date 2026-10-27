FROM node:22-alpine@sha256:8ea2348b068a9544dae7317b4f3aafcdc032df1647bb7d768a05a5cad1a7683f
WORKDIR /app
COPY research.mjs game.mjs ./
ENV NODE_ENV=production RESEARCH_DATA=/data PORT=8091
USER node
EXPOSE 8091
CMD ["node", "--disable-warning=ExperimentalWarning", "research.mjs"]
