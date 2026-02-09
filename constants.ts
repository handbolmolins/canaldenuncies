
import { Indicator } from './types';

export const INDICATORS: Indicator[] = [
  {
    category: 'Senyals Físics Específics',
    items: [
      'Molèsties evidents en genitals',
      'Dificultats per a caminar o asseure’s',
      'Senyals físics de cops o empentes'
    ]
  },
  {
    category: 'Comportaments Associats',
    items: [
      'Ús d’informació inusual per a l’edat sobre temes sexuals',
      'Sensibilitat extrema al contacte físic',
      'Atacs d’ira injustificats',
      'Por de quedar-se sol amb una persona concreta',
      'Descens brusc del rendiment esportiu'
    ]
  },
  {
    category: 'Indicadors Inespecífics',
    items: [
      'Canvis notoris en hàbits alimentaris',
      'Incontinència urinària o fecal sobtada',
      'Desinterès general per l’activitat',
      'Tendència a aïllar-se del grup'
    ]
  }
];

export const APP_THEME = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-amber-500 hover:bg-amber-600 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  card: 'bg-white rounded-xl shadow-sm border border-slate-200'
};
