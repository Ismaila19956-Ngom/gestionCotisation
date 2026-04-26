const fs = require('fs');

const data = `1- Groupe 10.000F : Vincent Faye ✅✅✅✅✅, Clément Faye ✅✅✅✅✅, Massamba Thioye ✅✅✅✅❌, Papa A. Sow ✅✅✅✅✅, Pierre Faye ✅✅✅✅✅, Moussa Diakité ✅✅✅✅❌, Assane Sow ✅✅✅✅✅, Ibrahima Ngom ✅✅✅✅✅, Modou Sow ✅✅✅✅✅, El Hadji M. Ndiaye ✅✅✅✅✅, Léopold Kama ✅✅✅✅✅, A. Baba Sow ✅✅✅✅✅, Mamadou Ngom ❌❌✅❌❌, Malick Cissé ❌❌✅✅✅.
2- Groupe 5000F : Ibrahima Sagna Kam’s ✅✅✅✅✅, Adama DIOUF ✅✅✅✅✅, Souka Diouf ❌✅✅✅✅, El Hadji M. Diouf ✅✅✅✅✅, Adramé Diouf ✅✅✅❌✅, Baye Diankha ✅✅✅✅✅, Birame Ndong ✅✅✅✅❌, Babacar Ngor Ndong ✅✅✅❌✅, Samba Sow ✅✅✅✅✅, Bassirou Ngom ✅✅✅✅✅, Barham Lo ✅✅❌❌❌, Bibi Sarr ✅✅❌❌❌, Mbaye Sène ✅✅✅✅✅, Mouhamadou Jacques Diouf ❌✅✅✅❌, Amadou Kane ✅❌❌❌❌, Seydou A. Diouf ✅❌❌❌❌, Fatou Diafouné ✅❌❌❌❌, Mamadou Ndour ❌✅❌❌❌, Moustapha Ngom ❌❌❌❌✅.
3- Groupe 3000F : Demba Sow ✅✅✅✅✅, Madou Thiam ✅✅✅✅✅, Aziz Ndiaye ✅✅✅❌❌, Mansour Ba ✅✅✅❌❌, Mamadou Ndour ✅❌❌❌❌, Abdourakhmane Diouf ✅✅✅✅✅.
4- Groupe 2000F : Ass Bop ✅✅✅✅✅, Omar Sow ✅✅✅✅✅, Odile Kama ✅✅✅✅❌, Pape M. Sène ✅✅✅✅✅, Ameth Saloum ✅✅✅✅✅, Omar Bop ✅❌❌❌❌, El Hadji Dieng ✅✅❌❌❌, Omar Dione ✅✅✅✅✅, Ablaye Faye ✅✅❌❌❌, Wally Diouf ✅✅❌❌❌, Ismaïla Ngom ❌✅❌❌❌, Adja S. Sow ✅✅✅✅❌, Ngouye THIAM ✅✅✅✅❌.
5- Groupe 1000F : Ousmane Fate ✅✅✅✅✅, Abba Sow ✅✅✅✅❌, Look Sané ✅❌❌❌❌, Mouhamed Thioye ✅❌❌✅❌, Moustapha Faye ✅✅✅✅✅, Thierno Ndiaye ❌❌❌❌❌, Sémou Diouf ❌❌❌✅❌.`;

const lines = data.split('\n');
const result = [];
const months = ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février'];
let idCounter = 1;

lines.forEach(line => {
    if(!line.trim()) return;
    const match = line.match(/Groupe (\d+)\.?(\d*)F : (.*)/);
    if(match) {
        let amountStr = match[1] + match[2];
        let amount = parseInt(amountStr);
        let membersStr = match[3];
        let members = membersStr.split(', ');
        members.forEach(m => {
            let mMatch = m.match(/(.*?) ([✅❌]+)/);
            if(mMatch) {
                let name = mMatch[1].trim();
                let checks = mMatch[2];
                let isFemale = ['Fatou', 'Odile', 'Adja', 'Aissatou'].some(n => name.includes(n));
                let sex = isFemale ? 'Femme' : 'Homme';
                
                let paiements = [];
                let total = 0;
                for(let i=0; i<5; i++) {
                    let symbol = checks[i];
                    let pAmount = symbol === '✅' ? amount : 0;
                    let statut = symbol === '✅' ? 'Payé' : 'En retard';
                    paiements.push({
                        mois: months[i],
                        montant: amount,
                        statut: statut,
                        avance: pAmount,
                        reste: amount - pAmount,
                        observation: ''
                    });
                    total += pAmount;
                }
                
                result.push({
                    id: idCounter++,
                    nom: name,
                    sexe: sex,
                    categorie: amount,
                    montantTotalEncaisse: total,
                    paiements: paiements
                });
            }
        });
    }
});

fs.writeFileSync('src/assets/membres_asc.json', JSON.stringify(result, null, 2));
console.log('Fichier JSON généré avec succès dans src/assets/membres_asc.json');
