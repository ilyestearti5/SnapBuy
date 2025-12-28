interface DeliveryCompany {
  name: string;
  description: string;
  photo?: string;
}
export const populareDeliveryCompanies: Record<string, DeliveryCompany[]> = {
  dz: [
    {
      name: "Yalidine",
      description:
        "Algerian logistics company specializing in e-commerce delivery and parcel services.",
      photo:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaBt7pbhcBvi-KKWy_3HQ6729sq_EzkcH-xQ&s",
    },
    {
      name: "EMS",
      description:
        "Express Mail Courier, providing fast and reliable express delivery services across Algeria.",
      photo:
        "https://www.ems.dz/wp-content/uploads/2019/09/logo-ems-algerie-site.png",
    },
    {
      name: "Aramex",
      description:
        "International courier and logistics company offering express delivery and supply chain solutions in Algeria.",
      photo:
        "data:image/png;base64,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",
    },
    {
      name: "DHL",
      description:
        "Global express delivery service with extensive network for international and domestic shipping.",
      photo:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmsOubmbP_YalQ-Hc_VQG_zkQm-IcVAvVncA&s",
    },
    {
      name: "Chronopost",
      description:
        "French postal service providing express delivery and tracking for parcels and documents.",
      photo: "https://apps.oxatis.com/Files/112496/Img/11/Apps-Chronopost.jpg",
    },
    {
      name: "ColisEx",
      description:
        "Algerian parcel delivery service focused on secure and efficient shipping solutions.",
      photo:
        "https://www.colisexpat.com/wp-content/uploads/2023/06/logo-colisexpat-mobile.png",
    },
    {
      name: "FedEx",
      description:
        "International shipping company offering express delivery, freight, and logistics services worldwide.",
      photo:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRGayMjiiJJf8uonxTgDMGIPjbZNH8nD-hVQ&s",
    },
    {
      name: "UPS",
      description:
        "United Parcel Service, a global leader in package delivery and supply chain management.",
      photo: "https://www.gopostship.com/imgbin/carriers/ups.png",
    },
    {
      name: "Poste Algérie",
      description:
        "Algerian national postal service providing mail, parcel, and financial services nationwide.",
      photo:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AlgeriePoste.svg/langfr-250px-AlgeriePoste.svg.png",
    },
    {
      name: "Rapidex",
      description:
        "Algerian delivery company offering fast and affordable parcel delivery services.",
      photo:
        "https://www.rapidexpress.pk/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.5281c210.png&w=256&q=75",
    },
  ],
  ma: [
    {
      name: "Aramex",
      description:
        "International courier and logistics company providing express delivery services in Morocco.",
    },
    {
      name: "DHL",
      description:
        "Global express delivery service operating in Morocco for international and domestic shipping.",
    },
    {
      name: "Chronopost",
      description:
        "French postal service offering express delivery and parcel tracking in Morocco.",
    },
    {
      name: "Poste Maroc",
      description:
        "Moroccan national postal service providing mail, parcel, and logistics services.",
    },
    {
      name: "ColisEx",
      description:
        "Parcel delivery service operating in Morocco for secure and efficient shipping.",
    },
  ],
  tn: [
    {
      name: "Aramex",
      description:
        "International courier company offering express delivery and logistics in Tunisia.",
    },
    {
      name: "DHL",
      description:
        "Global express delivery service with operations in Tunisia for international shipping.",
    },
    {
      name: "Chronopost",
      description:
        "French postal service providing express delivery and tracking services in Tunisia.",
    },
    {
      name: "Poste Tunisienne",
      description:
        "Tunisian national postal service offering mail, parcel, and financial services.",
    },
    {
      name: "Express Mail",
      description:
        "Local Tunisian courier service specializing in fast and reliable parcel delivery.",
    },
  ],
  ly: [
    {
      name: "Aramex",
      description:
        "International courier and logistics company operating in Libya for express delivery.",
    },
    {
      name: "DHL",
      description:
        "Global express delivery service providing international and domestic shipping in Libya.",
    },
    {
      name: "Libyan Post",
      description:
        "Libyan national postal service offering mail and parcel delivery services.",
    },
    {
      name: "Libya Express",
      description:
        "Local Libyan delivery service focused on fast and secure parcel transportation.",
    },
  ],
  fr: [
    {
      name: "Chronopost",
      description:
        "French postal service specializing in express delivery and parcel tracking.",
    },
    {
      name: "ColisEx",
      description:
        "French parcel delivery service offering secure and efficient shipping solutions.",
    },
    {
      name: "DHL",
      description:
        "Global express delivery service with extensive network in France.",
    },
    {
      name: "UPS",
      description:
        "United Parcel Service providing package delivery and logistics in France.",
    },
    {
      name: "La Poste",
      description:
        "French national postal service offering comprehensive mail and parcel services.",
    },
  ],
  de: [
    {
      name: "DHL",
      description:
        "Global express delivery service, originating from Germany, with worldwide operations.",
    },
    {
      name: "UPS",
      description:
        "United Parcel Service offering package delivery and supply chain solutions in Germany.",
    },
    {
      name: "Deutsche Post",
      description:
        "German national postal service providing mail, parcel, and logistics services.",
    },
    {
      name: "Hermes",
      description:
        "German delivery service specializing in parcel shipping and e-commerce logistics.",
    },
  ],
  us: [
    {
      name: "UPS",
      description:
        "United Parcel Service, a leading global package delivery and logistics company in the USA.",
    },
    {
      name: "FedEx",
      description:
        "Federal Express, international shipping company offering express delivery in the USA.",
    },
    {
      name: "USPS",
      description:
        "United States Postal Service providing mail and parcel delivery nationwide.",
    },
    {
      name: "DHL",
      description:
        "Global express delivery service with operations in the USA for international shipping.",
    },
  ],
  es: [
    {
      name: "Correos",
      description:
        "Spanish national postal service offering mail, parcel, and express delivery services.",
    },
    {
      name: "DHL",
      description:
        "Global express delivery service operating in Spain for international and domestic shipping.",
    },
    {
      name: "UPS",
      description:
        "United Parcel Service providing package delivery and logistics in Spain.",
    },
    {
      name: "Chronopost",
      description:
        "French postal service offering express delivery and tracking in Spain.",
    },
  ],
  it: [
    {
      name: "Poste Italiane",
      description:
        "Italian national postal service providing mail, parcel, and financial services.",
    },
    {
      name: "DHL",
      description:
        "Global express delivery service with operations in Italy for international shipping.",
    },
    {
      name: "UPS",
      description:
        "United Parcel Service offering package delivery and supply chain management in Italy.",
    },
    {
      name: "TNT",
      description:
        "Italian express delivery service specializing in fast and reliable parcel shipping.",
    },
    {
      name: "SDA Express",
      description:
        "Italian courier service providing express delivery and logistics solutions.",
    },
  ],
};
