export const staffList = [
  "Afif Derbas", "Ahmed Alrakabi", "Ahmed Ramadan", "Ajmen Rafiq", "Alana Salah",
  "Alharis Albayati", "Amir Al-istarabadi", "Anjelika Bååth", "Bashdar Reza",
  "Constanza Soto", "Deni Dulji", "Diana Gharib", "Drilon Muqkurtaj", "Heidar Farhan",
  "Hussein Ahmed", "Ida Björkbacka", "Ikhlas Almaliki", "Intisar Almansour",
  "Israa Touman", "Johan Wessberg", "Kaoula Channoufi", "Kim Torneus", "Lejla Kocacik",
  "Michelle Nilsson", "Mirza Celik", "Mirza Hodzic", "Nasima Kuraishe",
  "Nicolas Lazcano", "Omar Mezza", "Qasin Abdullahi", "Robert Ackar", "Samir Bezzina",
  "Sebastian Holm", "Wissam Hemissi", "Yasmin Ibrahim"
];

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('');
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'excellent':
      return 'status-excellent';
    case 'good':
      return 'status-good';
    case 'fair':
      return 'status-fair';
    case 'poor':
      return 'status-poor';
    default:
      return 'status-unknown';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'excellent':
      return 'Utmärkt';
    case 'good':
      return 'Bra';
    case 'fair':
      return 'Godtagbar';
    case 'poor':
      return 'Dålig';
    default:
      return 'Okänd';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getPriorityText(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'Akut';
    case 'high':
      return 'Hög';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Låg';
    default:
      return 'Okänd';
  }
}
