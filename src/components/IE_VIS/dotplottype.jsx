import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import "../../css/dotplottypes.css";

const fontText = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-secondary')
  .trim();

// Margens do gráfico
const margin = { top: 100, right: 50, bottom: 20, left: 400 };
// Número de linhas exibidas por página
const pageSize = 20;

// Função para determinar o tipo de flor baseado na contagem e tercis
const getFlowerType = (count, tercils) => {
  if (count <= tercils[0]) return 'flower3';      // 0-33% (baixo)
  if (count <= tercils[1]) return 'flower4';      // 33-67% (médio)
  return 'flower5';                               // 67-100% (alto)
};

// Função que retorna o path SVG para cada tipo de flor
const getFlowerPath = (type) => {
  const paths = {
    flower3: "M115.19,91.28c-1.63.05-3.27.11-4.9.16.76,3.42,2.84,14.77-3.62,25.4-1.72,2.83-6.26,10.32-14.9,12.15-1.97.42-9.99,2.12-14.61-3.3-3-3.53-3.55-8.87-1.58-13.81.13.33,1.9,4.46,6.39,5.37,4.14.84,7.16-1.76,7.68-2.22,2.08-1.86,4.16-5.45,2.83-9.24-1.02-2.92-3.73-5.02-6.96-5.46.26-.06,5.38-1.31,6.93-6.11,1.32-4.09-.59-8.76-4.45-10.82-4.18-2.23-9.02-.5-11.61,2.53-3.16,3.71-2.14,8.42-2.01,8.97-1.28-3.23-4.21-5.47-7.58-5.82-.37-.04-5.21-.47-7.94,3.33-2.16,3.01-2.05,7.36.43,10.22,2.77,3.19,6.99,2.78,7.38,2.74-3.84,3.7-9.14,5.16-13.85,3.72-8.11-2.49-9.41-12.08-9.47-12.6-.98-8.23,5.43-14.47,8.62-17.58,10.57-10.3,24.86-10.72,29.77-10.63-.45-1.55-.9-3.1-1.34-4.65-2.28.15-32.15,2.54-40.23,22.38-1,2.44-1.81,5.52-1.95,9.28.25,9.21,6.2,17.03,14.33,19.25,9.76,2.67,17.63-4.08,18.22-4.61-.3.64-4.47,9.95.73,17.73,4.45,6.67,12.39,7.24,14.78,7.42,12.41.9,21.19-9.11,23.06-11.39,10.87-13.22,6.4-30.39,5.84-32.41h0ZM27.91,84.05c.77-1.44,1.54-2.88,2.31-4.33-3.34-1.05-14.21-4.92-20.19-15.83-1.59-2.91-5.8-10.58-3.08-18.98.62-1.92,3.15-9.71,10.17-11,4.56-.84,9.45,1.36,12.75,5.54-.35-.05-4.81-.59-7.85,2.85-2.79,3.17-2.06,7.08-1.92,7.76.57,2.74,2.65,6.33,6.58,7.07,3.04.58,6.22-.72,8.21-3.3-.08.26-1.55,5.32,1.83,9.06,2.88,3.19,7.88,3.87,11.59,1.56,4.02-2.51,4.95-7.56,3.62-11.32-1.63-4.59-6.22-6.07-6.76-6.23,3.44.5,6.85-.91,8.83-3.66.22-.3,3.01-4.28,1.08-8.54-1.53-3.37-5.35-5.46-9.06-4.74-4.15.8-5.9,4.66-6.06,5.02-1.28-5.18.1-10.5,3.7-13.85,6.21-5.78,15.17-2.11,15.65-1.9,7.61,3.27,9.82,11.94,10.91,16.25,3.63,14.3-3.15,26.89-5.68,31.1,1.57.39,3.13.77,4.7,1.16,1.01-2.05,13.87-29.12.74-46.03-1.62-2.08-3.87-4.32-7.07-6.33-8.1-4.39-17.84-3.15-23.84,2.79-7.19,7.12-5.28,17.31-5.12,18.08-.4-.58-6.38-8.84-15.72-8.24-8,.52-12.47,7.11-13.81,9.09-6.98,10.29-2.71,22.9-1.67,25.67,6.02,16.02,23.12,20.74,25.15,21.26v.02ZM77.82,12.08c.86,1.39,1.73,2.78,2.59,4.17,2.58-2.37,11.37-9.84,23.81-9.57,3.31.07,12.06.26,17.98,6.83,1.35,1.5,6.83,7.59,4.44,14.31-1.55,4.37-5.9,7.5-11.17,8.28.22-.28,2.92-3.87,1.46-8.22-1.34-4-5.1-5.33-5.76-5.54-2.65-.87-6.8-.87-9.42,2.16-2.02,2.34-2.48,5.74-1.25,8.76-.18-.2-3.83-4-8.76-2.95-4.2.9-7.3,4.89-7.15,9.26.16,4.74,4.08,8.07,7.99,8.79,4.79.88,8.36-2.36,8.77-2.74-2.15,2.73-2.63,6.38-1.25,9.47.15.34,2.2,4.75,6.85,5.21,3.68.36,7.4-1.9,8.63-5.48,1.38-3.99-1.08-7.44-1.32-7.76,5.12,1.48,9.04,5.34,10.14,10.13,1.9,8.27-5.76,14.19-6.18,14.5-6.64,4.96-15.25,2.53-19.53,1.32-14.2-4.01-21.71-16.17-24.09-20.47-1.12,1.16-2.24,2.33-3.35,3.49,1.27,1.9,18.28,26.57,39.49,23.65,2.61-.36,5.68-1.19,9.01-2.96,7.85-4.82,11.65-13.88,9.51-22.04-2.57-9.79-12.35-13.23-13.1-13.48.7-.06,10.85-1.11,14.99-9.5,3.55-7.19.08-14.35-.97-16.51C124.76,4,111.7,1.4,108.78.91c-16.88-2.8-29.52,9.65-30.99,11.15l.03.02Z",
    flower4: "M115.64,108.18c-1.63-.03-3.27-.06-4.9-.09.59,3.45,2.07,14.89-4.93,25.18-1.86,2.74-6.79,9.98-15.51,11.36-1.99.32-10.08,1.6-14.42-4.06-2.82-3.68-3.08-9.04-.86-13.88.12.34,1.66,4.55,6.1,5.7,4.09,1.05,7.25-1.38,7.79-1.81,2.18-1.75,4.43-5.23,3.31-9.08-.87-2.97-3.47-5.21-6.67-5.82.27-.05,5.44-1.03,7.24-5.74,1.53-4.01-.13-8.78-3.88-11.04-4.06-2.44-8.99-.97-11.72,1.92-3.35,3.54-2.58,8.3-2.48,8.85-1.11-3.29-3.92-5.69-7.27-6.2-.37-.06-5.18-.74-8.1,2.91-2.31,2.89-2.43,7.24-.1,10.23,2.6,3.33,6.83,3.14,7.23,3.12-4.03,3.49-9.4,4.68-14.02,2.99-7.97-2.91-8.77-12.55-8.8-13.08-.55-8.27,6.18-14.17,9.52-17.1,11.09-9.74,25.38-9.41,30.28-9.07-.37-1.57-.73-3.14-1.1-4.71-2.28.03-32.24.87-41.34,20.25-1.12,2.39-2.09,5.42-2.43,9.17-.23,9.21,5.3,17.33,13.31,19.97,9.61,3.17,17.82-3.16,18.44-3.65-.33.62-4.98,9.7-.2,17.75,4.1,6.89,11.99,7.88,14.38,8.17,12.34,1.54,21.63-7.99,23.62-10.17,11.54-12.64,7.97-30.02,7.52-32.06h-.01ZM42.91,115.64c.03-1.63.06-3.27.09-4.9-3.45.59-14.89,2.07-25.18-4.93-2.74-1.86-9.98-6.79-11.36-15.51-.32-1.99-1.6-10.08,4.06-14.42,3.68-2.82,9.04-3.08,13.88-.86-.34.12-4.55,1.66-5.7,6.1-1.05,4.09,1.38,7.25,1.81,7.79,1.75,2.18,5.23,4.43,9.08,3.31,2.97-.87,5.21-3.47,5.82-6.67.05.27,1.03,5.44,5.74,7.24,4.01,1.53,8.78-.13,11.04-3.88,2.44-4.06.97-8.99-1.92-11.72-3.54-3.35-8.3-2.58-8.85-2.48,3.29-1.11,5.69-3.92,6.2-7.27.06-.37.74-5.18-2.91-8.1-2.89-2.31-7.24-2.43-10.23-.1-3.33,2.6-3.14,6.83-3.12,7.23-3.49-4.03-4.68-9.4-2.99-14.02,2.91-7.97,12.55-8.77,13.08-8.8,8.27-.55,14.17,6.18,17.1,9.52,9.74,11.09,9.41,25.38,9.07,30.28,1.57-.37,3.14-.73,4.71-1.1-.03-2.28-.87-32.24-20.25-41.34-2.39-1.12-5.42-2.09-9.17-2.43-9.21-.23-17.33,5.3-19.97,13.31-3.17,9.61,3.16,17.82,3.65,18.44-.62-.33-9.7-4.98-17.75-.2-6.89,4.1-7.88,11.99-8.17,14.38-1.54,12.34,7.99,21.63,10.17,23.62,12.64,11.54,30.02,7.97,32.06,7.52h0ZM35.46,42.91c1.63.03,3.27.06,4.9.09-.59-3.45-2.07-14.89,4.93-25.18,1.86-2.74,6.79-9.98,15.51-11.36,1.99-.32,10.08-1.6,14.42,4.06,2.82,3.68,3.08,9.04.86,13.88-.12-.34-1.66-4.55-6.1-5.7-4.09-1.05-7.25,1.38-7.79,1.81-2.18,1.75-4.43,5.23-3.31,9.08.87,2.97,3.47,5.21,6.67,5.82-.27.05-5.44,1.03-7.24,5.74-1.53,4.01.13,8.78,3.88,11.04,4.06,2.44,8.99.97,11.72-1.92,3.35-3.54,2.58-8.3,2.48-8.85,1.11,3.29,3.92,5.69,7.27,6.2.37.06,5.18.74,8.1-2.91,2.31-2.89,2.43-7.24.1-10.23-2.6-3.33-6.83-3.14-7.23-3.12,4.03-3.49,9.4-4.68,14.02-2.99,7.97,2.91,8.77,12.55,8.8,13.08.55,8.27-6.18,14.17-9.52,17.1-11.09,9.74-25.38,9.41-30.28,9.07.37,1.57.73,3.14,1.1,4.71,2.28-.03,32.24-.87,41.34-20.25,1.12-2.39,2.09-5.42,2.43-9.17.23-9.21-5.3-17.33-13.31-19.97-9.61-3.17-17.82,3.16-18.44,3.65.33-.62,4.98-9.7.2-17.75-4.1-6.89-11.99-7.88-14.38-8.17-12.34-1.54-21.63,7.99-23.62,10.17-11.54,12.64-7.97,30.02-7.52,32.06h.01ZM108.18,35.46c-.03,1.63-.06,3.27-.09,4.9,3.45-.59,14.89-2.07,25.18,4.93,2.74,1.86,9.98,6.79,11.36,15.51.32,1.99,1.6,10.08-4.06,14.42-3.68,2.82-9.04,3.08-13.88.86.34-.12,4.55-1.66,5.7-6.1,1.05-4.09-1.38-7.25-1.81-7.79-1.75-2.18-5.23-4.43-9.08-3.31-2.97.87-5.21,3.47-5.82,6.67-.05-.27-1.03-5.44-5.74-7.24-4.01-1.53-8.78.13-11.04,3.88-2.44,4.06-.97,8.99,1.92,11.72,3.54,3.35,8.3,2.58,8.85,2.48-3.29,1.11-5.69,3.92-6.2,7.27-.06.37-.74,5.18,2.91,8.1,2.89,2.31,7.24,2.43,10.23.1,3.33-2.6,3.14-6.83,3.12-7.23,3.49,4.03,4.68,9.4,2.99,14.02-2.91,7.97-12.55,8.77-13.08,8.8-8.27.55-14.17-6.18-17.1-9.52-9.74-11.09-9.41-25.38-9.07-30.28-1.57.37-3.14.73-4.71,1.1.03,2.28.87,32.24,20.25,41.34,2.39,1.12,5.42,2.09,9.17,2.43,9.21.23,17.33-5.3,19.97-13.31,3.17-9.61-3.16-17.82-3.65-18.44.62.33,9.7,4.98,17.75.2,6.89-4.1,7.88-11.99,8.17-14.38,1.54-12.34-7.99-21.63-10.17-23.62-12.64-11.54-30.02-7.97-32.06-7.52h-.01Z",
    flower5: "M114.54,108.18c-1.63-.03-3.27-.06-4.9-.09.59,3.45,2.07,14.89-4.93,25.18-1.86,2.74-6.79,9.98-15.51,11.36-1.99.32-10.08,1.6-14.42-4.06-2.82-3.68-3.08-9.04-.86-13.88.12.34,1.66,4.55,6.1,5.7,4.09,1.05,7.25-1.38,7.79-1.81,2.18-1.75,4.43-5.23,3.31-9.08-.87-2.97-3.47-5.21-6.67-5.82.27-.05,5.44-1.03,7.24-5.74,1.53-4.01-.13-8.78-3.88-11.04-4.06-2.44-8.99-.97-11.72,1.92-3.35,3.54-2.58,8.3-2.48,8.85-1.11-3.29-3.92-5.69-7.27-6.2-.37-.06-5.18-.74-8.1,2.91-2.31,2.89-2.43,7.24-.1,10.23,2.6,3.33,6.83,3.14,7.23,3.12-4.03,3.49-9.4,4.68-14.02,2.99-7.97-2.91-8.77-12.55-8.8-13.08-.55-8.27,6.18-14.17,9.52-17.1,11.09-9.74,25.38-9.41,30.28-9.07-.37-1.57-.73-3.14-1.1-4.71-2.28.03-32.24.87-41.34,20.25-1.12,2.39-2.09,5.42-2.43,9.17-.23,9.21,5.3,17.33,13.31,19.97,9.61,3.17,17.82-3.16,18.44-3.65-.33.62-4.98,9.7-.2,17.75,4.1,6.89,11.99,7.88,14.38,8.17,12.34,1.54,21.63-7.99,23.62-10.17,11.54-12.64,7.97-30.02,7.52-32.06h-.01ZM66.23,126.58l-2.37-4.29c-2.7,2.23-11.86,9.24-24.27,8.32-3.31-.24-12.03-.89-17.6-7.75-1.27-1.57-6.43-7.93-3.69-14.52,1.78-4.28,6.29-7.19,11.59-7.68-.23.27-3.11,3.72-1.88,8.13,1.13,4.07,4.82,5.58,5.46,5.84,2.61,1.01,6.75,1.22,9.52-1.67,2.14-2.23,2.78-5.61,1.7-8.69.17.21,3.62,4.2,8.59,3.4,4.24-.68,7.54-4.5,7.62-8.88.08-4.74-3.65-8.27-7.53-9.19-4.74-1.13-8.48,1.92-8.9,2.28,2.29-2.61,2.96-6.24,1.74-9.39-.13-.35-1.95-4.86-6.57-5.56-3.66-.56-7.49,1.51-8.91,5.02-1.58,3.91.7,7.49.91,7.82-5.04-1.74-8.75-5.8-9.6-10.65-1.47-8.36,6.49-13.87,6.92-14.16,6.89-4.61,15.36-1.73,19.57-.31,13.98,4.74,20.84,17.28,22.99,21.69,1.18-1.1,2.35-2.21,3.53-3.31-1.17-1.96-16.87-27.49-38.21-25.67-2.63.22-5.74.9-9.16,2.48-8.09,4.4-12.35,13.26-10.64,21.51,2.05,9.91,11.65,13.85,12.38,14.14-.71.02-10.89.54-15.47,8.7-3.92,6.99-.82,14.33.11,16.54,4.83,11.46,17.74,14.74,20.62,15.37,16.71,3.68,29.98-8.1,31.53-9.52h.02ZM26.14,93.95c.84-1.4,1.69-2.8,2.53-4.2-3.28-1.22-13.93-5.66-19.34-16.86-1.44-2.98-5.25-10.87-2.08-19.12.72-1.88,3.66-9.53,10.73-10.46,4.6-.6,9.37,1.85,12.45,6.19-.35-.07-4.78-.84-7.98,2.44-2.96,3.02-2.43,6.97-2.32,7.65.43,2.76,2.31,6.45,6.21,7.41,3,.73,6.25-.4,8.37-2.87-.09.25-1.83,5.23,1.35,9.14,2.71,3.33,7.67,4.28,11.5,2.16,4.14-2.3,5.34-7.29,4.2-11.11-1.39-4.67-5.9-6.38-6.43-6.57,3.41.68,6.88-.55,9.01-3.19.23-.29,3.23-4.12,1.53-8.47-1.35-3.45-5.06-5.73-8.8-5.2-4.18.59-6.14,4.35-6.31,4.7-1.01-5.24.65-10.48,4.42-13.64,6.51-5.45,15.26-1.32,15.73-1.09,7.43,3.66,9.18,12.43,10.05,16.8,2.88,14.47-4.54,26.69-7.29,30.76,1.54.47,3.09.94,4.63,1.4,1.11-1.99,15.37-28.35,3.13-45.92-1.51-2.17-3.64-4.52-6.73-6.69-7.86-4.81-17.66-4.07-23.95,1.54-7.55,6.73-6.17,17.01-6.06,17.79-.37-.6-5.91-9.16-15.27-9.04-8.02.1-12.82,6.45-14.27,8.36-7.51,9.92-3.89,22.73-3,25.55,5.17,16.31,22.01,21.91,24.01,22.54h-.02ZM34.36,42.91c1.63.03,3.27.06,4.9.09-.59-3.45-2.07-14.89,4.93-25.18,1.86-2.74,6.79-9.98,15.51-11.36,1.99-.32,10.08-1.6,14.42,4.06,2.82,3.68,3.08,9.04.86,13.88-.12-.34-1.66-4.55-6.1-5.7-4.09-1.05-7.25,1.38-7.79,1.81-2.18,1.75-4.43,5.23-3.31,9.08.87,2.97,3.47,5.21,6.67,5.82-.27.05-5.44,1.03-7.24,5.74-1.53,4.01.13,8.78,3.88,11.04,4.06,2.44,8.99.97,11.72-1.92,3.35-3.54,2.58-8.3,2.48-8.85,1.11,3.29,3.92,5.69,7.27,6.2.37.06,5.18.74,8.1-2.91,2.31-2.89,2.43-7.24.1-10.23-2.6-3.33-6.83-3.14-7.23-3.12,4.03-3.49,9.4-4.68,14.02-2.99,7.97,2.91,8.77,12.55,8.8,13.08.55,8.27-6.18,14.17-9.52,17.1-11.09,9.74-25.38,9.41-30.28,9.07.37,1.57.73,3.14,1.1,4.71,2.28-.03,32.24-.87,41.34-20.25,1.12-2.39,2.09-5.42,2.43-9.17.23-9.21-5.3-17.33-13.31-19.97-9.61-3.17-17.82,3.16-18.44,3.65.33-.62,4.98-9.7.2-17.75-4.1-6.89-11.99-7.88-14.38-8.17-12.34-1.54-21.63,7.99-23.62,10.17-11.54,12.64-7.97,30.02-7.52,32.06h.01ZM82.66,24.51l2.37,4.29c2.7-2.23,11.86-9.24,24.27-8.32,3.31.24,12.03.89,17.6,7.75,1.27,1.57,6.43,7.93,3.69,14.52-1.78,4.28-6.29,7.19-11.59,7.68.23-.27,3.11-3.72,1.88-8.13-1.13-4.07-4.82-5.58-5.46-5.84-2.61-1.01-6.75-1.22-9.52,1.67-2.14,2.23-2.78,5.61-1.7,8.69-.17-.21-3.62-4.2-8.59-3.4-4.24.68-7.54,4.5-7.62,8.88-.08,4.74,3.65,8.27,7.53,9.19,4.74,1.13,8.48-1.92,8.9-2.28-2.29,2.61-2.96,6.24-1.74,9.39.13.35,1.95,4.86,6.57,5.56,3.66.56,7.49-1.51,8.91-5.02,1.58-3.91-.7-7.49-.91-7.82,5.04,1.74,8.75,5.8,9.6,10.65,1.47,8.36-6.49,13.87-6.92,14.16-6.89,4.61-15.36,1.73-19.57.31-13.98-4.74-20.84-17.28-22.99-21.69-1.18,1.1-2.35,2.21-3.53,3.31,1.17,1.96,16.87,27.49,38.21,25.67,2.63-.22,5.74-.9,9.16-2.48,8.09-4.4,12.35-13.26,10.64-21.51-2.05-9.91-11.65-13.85-12.38-14.14.71-.02,10.89-.54,15.47-8.7,3.92-6.99.82-14.33-.11-16.54-4.83-11.46-17.74-14.74-20.62-15.37-16.71-3.68-29.98,8.1-31.53,9.52h-.02ZM122.75,57.14c-.84,1.4-1.69,2.8-2.53,4.2,3.28,1.22,13.93,5.66,19.34,16.86,1.44,2.98,5.25,10.87,2.08,19.12-.72,1.88-3.66,9.53-10.73,10.46-4.6.6-9.37-1.85-12.45-6.19.35.07,4.78.84,7.98-2.44,2.96-3.02,2.43-6.97,2.32-7.65-.43-2.76-2.31-6.45-6.21-7.41-3-.73-6.25.4-8.37,2.87.09-.25,1.83-5.23-1.35-9.14-2.71-3.33-7.67-4.28-11.5-2.16-4.14,2.3-5.34,7.29-4.2,11.11,1.39,4.67,5.9,6.38,6.43,6.57-3.41-.68-6.88.55-9.01,3.19-.23.29-3.23,4.12-1.53,8.47,1.35,3.45,5.06,5.73,8.8,5.2,4.18-.59,6.14-4.35,6.31-4.7,1.01,5.24-.65,10.48-4.42,13.64-6.51,5.45-15.26,1.32-15.73,1.09-7.43-3.66-9.18-12.43-10.05-16.8-2.88-14.47,4.54-26.69,7.29-30.76-1.54-.47-3.09-.94-4.63-1.4-1.11,1.99-15.37,28.35-3.13,45.92,1.51,2.17,3.64,4.52,6.73,6.69,7.86,4.81,17.66,4.07,23.95-1.54,7.55-6.73,6.17-17.01,6.06-17.79.37.6,5.91,9.16,15.27,9.04,8.02-.1,12.82-6.45,14.27-8.36,7.51-9.92,3.89-22.73,3-25.55-5.17-16.31-22.01-21.91-24.01-22.54h.02Z",
  };
  return paths[type];
};

// Função para obter as dimensões do viewBox de cada flor
const getFlowerViewBox = (type) => {
  const viewBoxes = {
    flower3: { width: 150, height: 150, centerX: 75, centerY: 75 },
    flower4: { width: 151.57, height: 151.57, centerX: 75.785, centerY: 75.785 },
    flower5: { width: 147.14, height: 147.14, centerX: 73.57, centerY: 73.57 }
  };
  return viewBoxes[type];
};

const DotPlotTypes = () => {
  const svgRef = useRef();
  // Estados para armazenar dados e configurações
  const [data, setData] = useState([]);
  const [startIndex, setStartIndex] = useState(0); // Índice inicial para paginação
  const [filterActive, setFilterActive] = useState(false); // Filtro de músicas com mais de um tipo
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
  const [loadingText, setLoadingText] = useState("Carregando dados..."); // Texto do loading
  // Add a new state to track the animation mode
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [showLegend, setShowLegend] = useState(false); // Estado para mostrar/ocultar legenda

  // Novos estados para o sistema de visualização
  const [viewMode, setViewMode] = useState('songs'); // 'songs', 'mode', 'meter'
  const [showFilters, setShowFilters] = useState(false);
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false); // Novo estado
  const [selectedMeters, setSelectedMeters] = useState([]);
  const [selectedModes, setSelectedModes] = useState([]);

  // Carrega e processa os dados CSV ao montar o componente
  useEffect(() => {
    setIsLoading(true);
    setLoadingText("Carregando dados musicais...");

    d3.csv("sets.csv")
      .then(csvData => {
        setLoadingText("Processando informações...");

        setTimeout(() => {
          setData(csvData);
          setLoadingText("Finalizando...");

          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        }, 300);
      })
      .catch(error => {
        console.error("Erro ao carregar dados:", error);
        setLoadingText("Erro ao carregar dados");
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      });
  }, []);

  // Memoriza nomes, tipos e countMap baseado no modo de visualização
  const processedData = useMemo(() => {
    if (!data.length) return { names: [], types: [], countMap: new Map(), tercils: [] };

    let filteredData = [...data];

    // Aplicar filtros baseados no modo de visualização
    if (viewMode === 'songs') {
      if (selectedMeters.length > 0) {
        filteredData = filteredData.filter(d => selectedMeters.includes(d.meter));
      }
      if (selectedModes.length > 0) {
        filteredData = filteredData.filter(d => selectedModes.includes(d.mode));
      }
    } else if (viewMode === 'mode') {
      if (selectedMeters.length > 0) {
        filteredData = filteredData.filter(d => selectedMeters.includes(d.meter));
      }
    } else if (viewMode === 'meter') {
      if (selectedModes.length > 0) {
        filteredData = filteredData.filter(d => selectedModes.includes(d.mode));
      }
    }

    const types = Array.from(new Set(filteredData.map(d => d.type))).sort();
    let names, countMap;

    if (viewMode === 'songs') {
      names = Array.from(new Set(filteredData.map(d => d.name))).sort();
      countMap = d3.rollup(
        filteredData,
        v => v.length,
        d => d.name,
        d => d.type
      );
    } else if (viewMode === 'mode') {
      names = Array.from(new Set(filteredData.map(d => d.mode))).sort();
      countMap = d3.rollup(
        filteredData,
        v => v.length,
        d => d.mode,
        d => d.type
      );
    } else if (viewMode === 'meter') {
      names = Array.from(new Set(filteredData.map(d => d.meter))).sort();
      countMap = d3.rollup(
        filteredData,
        v => v.length,
        d => d.meter,
        d => d.type
      );
    }

    // Calcular tercis para classificação das flores
    const allCounts = [];
    for (const [name, typeMap] of countMap) {
      for (const [type, count] of typeMap) {
        allCounts.push(count);
      }
    }
    allCounts.sort(d3.ascending);

    const tercils = [
      d3.quantile(allCounts, 0.33),
      d3.quantile(allCounts, 0.67)
    ];

    return { names, types, countMap, tercils };
  }, [data, viewMode, selectedMeters, selectedModes]);

  const { names, types, countMap, tercils } = processedData;

  // Opções disponíveis para filtros
  const availableMeters = useMemo(() =>
    Array.from(new Set(data.map(d => d.meter))).sort(), [data]);
  const availableModes = useMemo(() =>
    Array.from(new Set(data.map(d => d.mode))).sort(), [data]);

  // Re-renderiza o dotplot quando os dados ou controles mudam
  useEffect(() => {
    if (data.length && names.length && types.length && countMap.size) {
      renderDotPlotTypes();
    }
  }, [data, names, types, countMap, tercils, startIndex, filterActive, viewMode]);

  // Reset pagination when view mode changes
  useEffect(() => {
    setStartIndex(0);
  }, [viewMode, selectedMeters, selectedModes]);

  // Retorna apenas nomes que possuem mais de um tipo associado
  const getFilteredNames = () => {
    return Array.from(countMap.entries())
      .filter(([_, typeMap]) => typeMap.size > 1)
      .map(([name]) => name)
      .sort();
  };

  // Função principal de renderização do dotplot
  const renderDotPlotTypes = () => {
    const svg = d3.select(svgRef.current);

    // Clear any existing content regardless of animation setting
    svg.selectAll("g").remove();

    // Create new chart immediately
    createNewChart();

    // Reset animation flag for future renders
    if (!shouldAnimate) {
      // Use setTimeout to avoid batching with current render
      setTimeout(() => setShouldAnimate(true), 0);
    }

    function createNewChart() {
      // Calcula largura e altura internas do gráfico
      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom;

      // Centraliza o grupo principal horizontalmente no SVG
      const svgWidth = +svg.attr("width");
      const gTranslateX = margin.left + (svgWidth - margin.left - margin.right - width) / 2;

      // Grupo principal do gráfico 
      const g = svg
        .append("g")
        .attr("transform", `translate(${gTranslateX},${margin.top})`)
        // Skip initial opacity setting if not animating
        .style("opacity", shouldAnimate ? 0 : 1);

      // Define nomes visíveis de acordo com filtro e paginação
      const currentNames = filterActive ? getFilteredNames() : names;
      const visibleNames = currentNames.slice(startIndex, startIndex + pageSize);

      // Escalas para os eixos X (tipos) e Y (nomes)
      const xScale = d3.scaleBand().domain(types).range([0, width]).padding(0.1);
      const yScale = d3
        .scaleBand()
        .domain(visibleNames)
        .range([0, height])
        .padding(0.1);

      // Escala de tamanho para as flores
      const maxCount = d3.max(Array.from(countMap.values(), (m) => d3.max(m.values())));
      const sizeScale = d3
        .scaleSqrt()
        .domain([1, maxCount])
        .range([0.12, 0.5]); // Escala de tamanho da flor

      // Eixo Y (nomes)
      g.append("g").call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-family", fontText)
        .style("font-size", "14px");

      // Eixo X (tipos)
      g.append("g")
        .attr("transform", `translate(0,-10)`)
        .call(d3.axisTop(xScale))
        .selectAll("text")
        .attr("transform", "rotate(0)")
        .style("text-anchor", "center")
        .style("font-family", fontText)
        .style("font-size", "14px");

      // Linhas de grade horizontais
      g.selectAll(".y-grid")
        .data(visibleNames)
        .enter()
        .append("line")
        .attr("class", "y-grid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", (d) => yScale(d) + yScale.bandwidth() / 2)
        .attr("y2", (d) => yScale(d) + yScale.bandwidth() / 2)
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2");

      // Linhas de grade verticais
      g.selectAll(".x-grid")
        .data(types)
        .enter()
        .append("line")
        .attr("class", "x-grid")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("x1", (d) => xScale(d) + xScale.bandwidth() / 2)
        .attr("x2", (d) => xScale(d) + xScale.bandwidth() / 2)
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2");

      // Remove tooltip existente se houver
      d3.select("body").selectAll(".tooltip").remove();

      // Tooltip para mostrar detalhes ao passar o mouse
      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      // Renderiza as flores do dotplot
      const flowers = [];
      for (const [name, typeMap] of countMap) {
        if (!visibleNames.includes(name)) continue;
        for (const [type, count] of typeMap) {
          const flowerType = getFlowerType(count, tercils);
          const finalScale = sizeScale(count);
          const flowerViewBox = getFlowerViewBox(flowerType);

          // Calcular posição central da célula da grid
          const gridCenterX = xScale(type) + xScale.bandwidth() / 2;
          const gridCenterY = yScale(name) + yScale.bandwidth() / 2;

          // Calcular offset para centralizar a flor na célula
          const offsetX = gridCenterX - (flowerViewBox.centerX * finalScale);
          const offsetY = gridCenterY - (flowerViewBox.centerY * finalScale);

          const flower = g.append("path")
            .attr("class", `flowerIE ${flowerType}`)
            .attr("d", getFlowerPath(flowerType))
            .attr("transform", shouldAnimate ?
              `translate(${offsetX}, ${offsetY}) scale(0)` :
              `translate(${offsetX}, ${offsetY}) scale(${finalScale})`)
            .style("fill", "#4a90e2") // Cor fixa azul
            .style("opacity", shouldAnimate ? 0 : 0.8)
            .style("cursor", "pointer")
            .on("mouseover", function (event) {
              d3.select(this)
                .style("fill", "#6A5ACD")
                .style("opacity", 1);
              tooltip.transition().duration(100).style("opacity", 1);
              tooltip.html(`<strong>${name}</strong><br>${type}: <b>${count}</b> variações`);
            })
            .on("mousemove", function (event) {
              tooltip
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function () {
              d3.select(this)
                .style("fill", "#4a90e2")
                .style("opacity", 0.8);
              tooltip.transition().duration(200).style("opacity", 0);
            });

          if (shouldAnimate) {
            flowers.push({ flower, finalScale, offsetX, offsetY });
          }
        }
      }

      // Only animate if shouldAnimate is true
      if (shouldAnimate) {
        // Animação de fade in do grupo principal
        g.transition()
          .duration(700)
          .style("opacity", 1);

        // Animação das flores com delay escalonado
        flowers.forEach(({ flower, finalScale, offsetX, offsetY }, index) => {
          flower
            .transition()
            .delay(200 + index * 10) // Delay escalonado para efeito em cascata
            .duration(700)
            .ease(d3.easeBackOut)
            .attr("transform", `translate(${offsetX}, ${offsetY}) scale(${finalScale})`)
            .style("opacity", 0.8); // Fade in
        });
      }
    }
  };

  // Função para lidar com mudança de filtro
  const handleFilterToggle = () => {
    setIsLoading(true);
    setLoadingText("Aplicando filtro...");

    setTimeout(() => {
      setFilterActive((prev) => !prev);
      setStartIndex(0); // Reset para primeira página
      setLoadingText("Atualizando visualização...");

      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }, 200);
  };

  // Função para lidar com navegação
  const handleNavigation = (direction) => {
    setIsLoading(true);
    setLoadingText("Carregando página...");
    setShouldAnimate(false);

    setTimeout(() => {
      if (direction === 'up') {
        setStartIndex((prev) => Math.max(prev - pageSize, 0));
      } else {
        const currentNames = filterActive ? getFilteredNames() : names;
        if (startIndex + pageSize < currentNames.length) {
          setStartIndex((prev) => prev + pageSize);
        }
      }

      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }, 200);
  };

  // Funções para lidar com mudanças de filtros
  const handleMeterChange = (meter) => {
    setSelectedMeters(prev =>
      prev.includes(meter)
        ? prev.filter(m => m !== meter)
        : [...prev, meter]
    );
  };

  const handleModeChange = (mode) => {
    setSelectedModes(prev =>
      prev.includes(mode)
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };

  const clearFilters = () => {
    setSelectedMeters([]);
    setSelectedModes([]);
  };

  const applyFilters = () => {
    setShowFilters(false);
    setStartIndex(0);
  };

  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'songs': return 'Songs';
      case 'mode': return 'Mode';
      case 'meter': return 'Meter';
      default: return 'Songs';
    }
  };

  // Função para lidar com mudança do modo de visualização
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    setShowViewModeDropdown(false);
    setStartIndex(0);
  };

  // Nova função para gerenciar dropdowns
  const handleDropdownToggle = (dropdownType) => {
    if (dropdownType === 'viewMode') {
      setShowViewModeDropdown(!showViewModeDropdown);
      setShowFilters(false); // Fecha o dropdown de filtros
    } else if (dropdownType === 'filters') {
      setShowFilters(!showFilters);
      setShowViewModeDropdown(false); // Fecha o dropdown de view mode
    }
  };

  // Add calculation for total pages
  const totalPages = useMemo(() => {
    const currentNames = filterActive ? getFilteredNames() : names;
    return Math.ceil(currentNames.length / pageSize);
  }, [names, filterActive, getFilteredNames]);

  const currentPage = Math.floor(startIndex / pageSize) + 1;

  return (
    <div className="DotPlotTypes-container" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999
        }}>
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">{loadingText}</div>
          </div>
        </div>
      )}

      {/* Novos controles de visualização */}
      <div className="visualization-controls">
        <div className="control-group">
          <div className="dropdown-container">
            <button
              className="dropdown-btn view-mode-btn"
              onClick={() => handleDropdownToggle('viewMode')}
            >
              Visualizar por <span className="chevron">▼</span>
            </button>
            {showViewModeDropdown && (
              <div className="dropdown-content1">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={viewMode === 'songs'}
                    onChange={() => handleViewModeChange('songs')}
                  />
                  Songs
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={viewMode === 'mode'}
                    onChange={() => handleViewModeChange('mode')}
                  />
                  Mode
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={viewMode === 'meter'}
                    onChange={() => handleViewModeChange('meter')}
                  />
                  Meter
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="control-group">
          <div className="dropdown-container">
            <button
              className="dropdown-btn filter-btn"
              onClick={() => handleDropdownToggle('filters')}
            >
              <span className="filter-icon"></span> Filtrar por <span className="chevron">▼</span>
            </button>
            {showFilters && (
              <div className="dropdown-content2 filter-panel">
                <div className="filter-sections">
                  <div className="filter-section">
                    <h4>Meter</h4>
                    {availableMeters.map(meter => (
                      <label key={meter} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedMeters.includes(meter)}
                          onChange={() => handleMeterChange(meter)}
                          disabled={viewMode === 'meter'}
                        />
                        {meter}
                      </label>
                    ))}
                  </div>

                  <div className="filter-section">
                    <h4>Mode</h4>
                    {availableModes.map(mode => (
                      <label key={mode} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedModes.includes(mode)}
                          onChange={() => handleModeChange(mode)}
                          disabled={viewMode === 'mode'}
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-actions">
                  <button className="clear-filters-btn-dp" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                  <button className="apply-filters-btn" onClick={applyFilters}>
                    Aplicar filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="control-group">
          <button
            onClick={handleFilterToggle}
            disabled={isLoading}
            className="multi-type-btn"
            style={{
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {viewMode === 'songs'
              ? (filterActive ? "Mostrar todas as músicas" : "Mostrar músicas com mais de um tipo")
              : `Mostrar ${getViewModeLabel().toLowerCase()}s com mais de um tipo`
            }
          </button>
        </div>
        <div className="controls">
          {/* Botão para navegar para cima na paginação */}
          <button
            id="nav-up"
            onClick={() => handleNavigation('up')}
            disabled={isLoading || startIndex === 0}
            title="Página anterior"
            style={{
              opacity: isLoading || startIndex === 0 ? 0.6 : 1,
              cursor: isLoading || startIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ↑
          </button>

          {/* Span para mostrar progresso da paginação */}
          <span>
            {getViewModeLabel()} {currentPage} de {totalPages}
          </span>

          {/* Botão para navegar para baixo na paginação */}
          <button
            id="nav-down"
            onClick={() => handleNavigation('down')}
            disabled={isLoading || startIndex + pageSize >= (filterActive ? getFilteredNames() : names).length}
            title="Próxima página"
            style={{
              opacity: isLoading || startIndex + pageSize >= (filterActive ? getFilteredNames() : names).length ? 0.6 : 1,
              cursor: isLoading || startIndex + pageSize >= (filterActive ? getFilteredNames() : names).length ? 'not-allowed' : 'pointer'
            }}
          >
            ↓
          </button>
        </div>
      </div>

      {/* SVG onde o dotplot é desenhado */}
      <svg className="DotPlotTypessvg" ref={svgRef} width={1500} height={900} />
    </div>
  );
};

export default DotPlotTypes;