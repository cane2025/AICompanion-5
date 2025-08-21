export interface Personnel {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const personnelList: Personnel[] = [
  {
    id: "1",
    name: "Anna Andersson",
    email: "anna.andersson@ungdoms.se",
    role: "Socialsekreterare"
  },
  {
    id: "2", 
    name: "Erik Eriksson",
    email: "erik.eriksson@ungdoms.se",
    role: "Kurator"
  },
  {
    id: "3",
    name: "Maria Nilsson", 
    email: "maria.nilsson@ungdoms.se",
    role: "Behandlingsassistent"
  },
  {
    id: "4",
    name: "Johan Johansson",
    email: "johan.johansson@ungdoms.se", 
    role: "Socialsekreterare"
  },
  {
    id: "5",
    name: "Lisa Larsson",
    email: "lisa.larsson@ungdoms.se",
    role: "Familjebehandlare"
  },
  {
    id: "6",
    name: "Mikael Svensson",
    email: "mikael.svensson@ungdoms.se",
    role: "Enhetschef"
  }
];
