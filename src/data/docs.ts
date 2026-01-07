/**
 * YM Documentation Data
 *
 * Contains all SOPs and resource documents for the Docs page.
 * Data sourced from the YM Master Drive SOP Directory.
 */

export type DocLink = {
  title: string
  url: string
}

export type DocCategory = {
  name: string
  docs: DocLink[]
}

/**
 * Resources - Frequently accessed reference documents
 */
export const RESOURCES: DocLink[] = [
  {
    title: 'YM Halaqah Topics List',
    url: 'https://docs.google.com/document/d/17bcpogsGqRm8RJ4KeWnfxOu3LbPiS8W6whA6z9U724U/edit?usp=sharing',
  },
  {
    title: 'Liability Waiver & Agreement Template',
    url: 'https://docs.google.com/document/d/1z2Xm_sDNu15SWDgyq9zOSYnDFKAa2AX-4B0ho54LgQw/edit?usp=sharing',
  },
]

/**
 * SOP Categories - Organized by department/function
 */
export const SOP_CATEGORIES: DocCategory[] = [
  {
    name: 'Core Team',
    docs: [
      {
        title: 'Core-Team Onboarding',
        url: 'https://docs.google.com/document/d/1N8zimF56pg-R16kCJRyGYWB-PZd2Q5DnSgBLW7ECqTs/edit?usp=drive_link',
      },
      {
        title: 'Taking Meeting Minutes',
        url: 'https://docs.google.com/document/d/1Gb2-t-ACM6VOwomWob9-wElYchQYFgZs1qHFilifLHk/edit?usp=sharing',
      },
    ],
  },
  {
    name: 'Tarbiyah / SC',
    docs: [
      {
        title: 'SC Lead Onboarding',
        url: 'https://docs.google.com/document/d/1zSmEmcCbPI22JXIQyU1tRcEhxPnrNdqLc1-PGvgFyIo/edit?usp=sharing',
      },
      {
        title: 'Ideal Study Circle',
        url: 'https://docs.google.com/document/d/17-472d-73IlIAnzkfguij6BC_-yM8MABV_yNDnfQMXo/edit?usp=sharing',
      },
    ],
  },
  {
    name: 'NNET Situations',
    docs: [
      {
        title: 'Dealing with Minors',
        url: 'https://drive.google.com/open?id=1-aMH-lrCs52Sj3WmTFy4OqPxSX7WxJjucAxkiVYoLXQ&usp=drive_copy',
      },
      {
        title: 'Dealing with Emergency Personnel',
        url: 'https://docs.google.com/document/d/129UvnUHC38FFkE3a6_cIMGM9thr8bAEpgEy4QpyXdUg/edit?usp=drive_link',
      },
      {
        title: 'Dealing with Injuries/Illness/Allergies',
        url: 'https://drive.google.com/open?id=1DoTNHVU4m9m_ScuFyexqsb5rascuZ2e7lApfOpGkKOM&usp=drive_copy',
      },
      {
        title: 'Addressing Altercations',
        url: 'https://docs.google.com/document/d/1caL4eP1ft6El3Qm7m417vHn0iOo-oPu0i8Z-wP84ZRI/edit?usp=drive_link',
      },
      {
        title: 'Dealing with Drugs/Alcohol',
        url: 'https://docs.google.com/document/d/1_3ujX0MZU8pf2o-D9ZKilDUtoFYh7tCSlfzXhRKnbHo/edit?usp=drive_link',
      },
      {
        title: 'LGBTQ+ Issues',
        url: 'https://drive.google.com/open?id=1yDjU2C0L-Y2rV1p4lVALks0WegnDTPLNKkwKi7EYT3E&usp=drive_copy',
      },
    ],
  },
  {
    name: 'Design / Merch',
    docs: [
      {
        title: 'Regional Design Requests',
        url: 'https://docs.google.com/document/d/1zK_MiQA8wav7ITcI01wpuKhAXsixUhS-T6AYYb5wvHU/edit?usp=drive_link',
      },
      {
        title: 'National Design Requests',
        url: 'https://docs.google.com/document/d/1fL-OP-WcLEArBfL3peFzFHQ9QJcM2OTAlDfD7_1uORw/edit?usp=drive_link',
      },
      {
        title: 'Sub-Regional Merch Requests',
        url: 'https://docs.google.com/document/d/1UA6iNPwTS4dKipFm0dUwLAlCB7wEmPHK3FK_H4pycuI/edit?usp=drive_link',
      },
      {
        title: 'National Merch Requests',
        url: 'https://docs.google.com/document/d/1IkEdWjGVQeMutzt_s8aTFyhYAhJotXLyBWUBqGWvaJE/edit?usp=sharing',
      },
      {
        title: 'Requesting a Pitch Deck',
        url: 'https://docs.google.com/document/d/1BcLZBWtPoOfdZPAodlCCmBayet49JhAb1ngL0Gu7sR4/edit?usp=drive_link',
      },
      {
        title: 'Establishing Supplier Relations',
        url: 'https://docs.google.com/document/d/1UPvEq8MCK8Ae6hmDjJVWAtqmRISc4vydsaUe-prRtcQ/edit?usp=drive_link',
      },
      {
        title: 'YMC Marketing and Design Team Collaborations',
        url: 'https://docs.google.com/document/d/1_tcOYyEptxuS4ZdJpoiFeeYRaYB_Bm3gci-iZrNEqmc/edit?usp=drive_link',
      },
      {
        title: 'Regional Merch Demographics',
        url: 'https://docs.google.com/document/d/18H9arT3a_Vxh5FNDnfAwzbZzFtAapguqg4vtDj5tdP0/edit?usp=drive_link',
      },
      {
        title: 'Finding Suppliers',
        url: 'https://docs.google.com/document/d/172zd58Xxtaz_cSw64LcsTq8rR3qqx1NiVrQ7VHgp1jI/edit?usp=drive_link',
      },
      {
        title: 'Creative Process',
        url: 'https://docs.google.com/document/d/1wlrqyElAWy6B37tKGA3PBLxMlnxScBMyaqjeyXJ8HUs/edit?usp=drive_link',
      },
      {
        title: 'Design Vetting',
        url: 'https://docs.google.com/document/d/1ulVHWdW1WXUfoJlg6l8VxMpokYAI--jpeJ3uI95ednY/edit?usp=drive_link',
      },
      {
        title: 'Brand Material Distribution',
        url: 'https://docs.google.com/document/d/1_jydiloS2t0hn9HGft8UfYPUdIq5GoPWclqtFZPupus/edit?usp=drive_link',
      },
      {
        title: 'Stock Identification and Organization',
        url: 'https://docs.google.com/document/d/170uR6H0HjECjrXWRHZLbSPWtUF3beRdq2PAxNPZJz7s/edit?usp=drive_link',
      },
      {
        title: 'Merchandise Team Onboarding',
        url: 'https://docs.google.com/document/d/1oxOHlJvhgExonexsseERtura4BzXgDzNoLx5XvYNdCA/edit?usp=drive_link',
      },
      {
        title: 'Merchandise Supplier RFP Template',
        url: 'https://docs.google.com/document/d/1JUJ7PsVC3UkfPL9m85oEDRbYmJ9q80aN7pV5j4drV68/edit?usp=drive_link',
      },
      {
        title: 'FIGMA Team Onboarding',
        url: 'https://docs.google.com/document/d/1RHQdPh4pnaBUuYYnf644z6mvcZMMNnuE5trp2-XooX4/edit?usp=drive_link',
      },
      {
        title: 'Design Team Onboarding',
        url: 'https://docs.google.com/document/d/1bjY7SKob-qnskFDarh2eqi61N7z723j0H3KHu0rmA8k/edit?usp=drive_link',
      },
    ],
  },
  {
    name: 'Conferences',
    docs: [
      {
        title: 'Program Chair Procedures and Processes',
        url: 'https://docs.google.com/document/d/1cs73ffKIVV47WHo145UnwmZa1mBYLoUcG6h6_mfjDfE/edit?usp=drive_link',
      },
      {
        title: 'Logistics Chair Procedures and Processes',
        url: 'https://docs.google.com/document/d/1vEk2CVSEC73BQOacJdLGazWxJ1h0pXkU_o7dhW8P97g/edit?usp=drive_link',
      },
      {
        title: 'Marketing Chair Procedures & Processes',
        url: 'https://docs.google.com/document/d/18l-8WOnyGqVIGfC5E7X9x6A3giCuf7QiKZusbDD7P1Y/edit?usp=drive_link',
      },
      {
        title: 'YMC Team Onboarding Procedures',
        url: 'https://docs.google.com/document/d/1nrWAMRFceiBgd8hsBUg6hYM3mUNHOl4q0Y1uP4PLWkI/edit?usp=drive_link',
      },
      {
        title: 'Booth Guidelines',
        url: 'https://docs.google.com/document/d/1JhAYrS6efTy1vDOH9i_tsa3_p0BZSdZSLqRCQV5Cgd8/edit?usp=drive_link',
      },
    ],
  },
  {
    name: 'Outreach',
    docs: [
      {
        title: 'Regional and Local Outreach',
        url: 'https://docs.google.com/document/d/11BjFZJQU81G93PjVm-0c8cAriigTxUeNIPsYqTkcpU0/edit?usp=sharing',
      },
      {
        title: 'Creating an MOU',
        url: 'https://docs.google.com/document/d/13RAEWyCQIiHDyB3TczjB9WT4RYzD-0C3l2t3AY6KbsQ/edit?usp=sharing',
      },
      {
        title: 'MOU Template',
        url: 'https://docs.google.com/document/d/13RH4x6eJXEYOZDx8ItjSImrPe-2tSf-HH0fzWr_GrfA/edit?usp=sharing',
      },
    ],
  },
  {
    name: 'HCM',
    docs: [
      {
        title: 'HCM Onboarding',
        url: 'https://docs.google.com/document/d/1Gyeku7XYiJdAhLE2UvLmldR7DTqmIKncIOehbBhYTRE/edit?usp=drive_link',
      },
      {
        title: 'HCM Forms',
        url: 'https://docs.google.com/document/d/14tiGCGj62ajMG4WRWhIJowozIyKnfyo0TnbCBPSZPnM/edit?usp=sharing',
      },
      {
        title: 'HCM Event Management',
        url: 'https://docs.google.com/document/d/1MSw5JSZiWC5lrjNt6Ugz6RW2DnpGycGqOYW3h7Z2BRw/edit?usp=sharing',
      },
      {
        title: 'HCM Mass Communication',
        url: 'https://docs.google.com/document/d/1nCXST8wMRoT4nnZ24KfSotikMg7Y15MAVkOO9hIsSs4/edit?usp=sharing',
      },
      {
        title: 'HCM Profile/Maintenance and Updates',
        url: 'https://docs.google.com/document/d/1ioSTUS43lQ7FycSn31e7Kw0CJjF3W8rB6Ysf-v_Y4vE/edit?usp=sharing',
      },
    ],
  },
  {
    name: 'Media',
    docs: [
      {
        title: 'YM Social Media',
        url: 'https://docs.google.com/document/d/1V3dIX3IWn-YFfVS46MIyu7QM2wvON7YEn-XsJEmOeZw/edit?usp=drive_link',
      },
      {
        title: 'General Posting Procedures',
        url: 'https://docs.google.com/document/d/1kpueT8pNL_ApuKTO3fWR4617aHAkqOvSli77Ye22-9Q/edit?usp=drive_link',
      },
      {
        title: 'YM Canva',
        url: 'https://docs.google.com/document/d/1-hM027vBK1w4Kf8jusX_8rI2OcXnO7mgcjDMp-ephaw/edit?usp=drive_link',
      },
      {
        title: 'YM Media Handbook',
        url: 'https://drive.google.com/file/d/1-Y-G36WRCH88yDOLFlX5ccggMDr7cIBw/view?usp=drive_link',
      },
    ],
  },
  {
    name: 'Finance',
    docs: [
      {
        title: 'Depositing and Reimbursement Guidelines',
        url: 'https://docs.google.com/document/d/1rpjLwwKH6I2hj2MHp1u9nvXGUFY1um1hJMUUdrotBSE/edit?usp=sharing',
      },
      {
        title: 'Fundraising Guidelines',
        url: 'https://docs.google.com/document/d/164mSHLYyxBOiWJQJ42xI4d9fwfsM5cTdmjZvmh179PA/edit?usp=sharing',
      },
      {
        title: 'Creating an Annual Budget',
        url: 'https://docs.google.com/document/d/1H8fjwz8k2jJLsxFn4XnHCt-zLAoRgiXmswMYwUEp6zQ/edit?usp=sharing',
      },
      {
        title: 'Uses of SR/NN Money',
        url: 'https://docs.google.com/document/d/1dxZAxLWZNObmOr2po4yeuWrDSy_ZSrt1DNRDvY1ntfg/edit?usp=sharing',
      },
      {
        title: 'Making a P&L Sheet',
        url: 'https://docs.google.com/document/d/1bnKRpOZapLAYPNJ3YGFotxOr0_QT-iypM-nLotY6pUs/edit?usp=sharing',
      },
    ],
  },
  {
    name: 'Subregions',
    docs: [
      {
        title: 'Event Lead Guidelines',
        url: 'https://docs.google.com/document/d/12m3HXwYL3qTBTEw82dwESVmAKRmiVusxDmCjeh55WP4/edit?usp=sharing',
      },
    ],
  },
  {
    name: 'Cloud',
    docs: [
      {
        title: 'Offboarding Leadership Into Cloud',
        url: 'https://docs.google.com/document/d/1MSJmFvPkSAi_bN0Y2r_213OXSUIkXIkLrLKJoC8TEgU/edit?usp=drive_link',
      },
      {
        title: 'Cloud Utilization Guide',
        url: 'https://docs.google.com/document/d/1EXjt_qhSHuW_6sYBVyK8znR9rCdkbSN9-OGvtDsN-Qo/edit?usp=drive_link',
      },
      {
        title: 'Cloud Annual Planning Template',
        url: 'https://docs.google.com/document/d/13H_CCv_nE_wov5Ot0s3laLcWJPD_utg9E6E_pabFlCo/edit?usp=drive_link',
      },
      {
        title: 'Cloud Coordinator Responsibilities',
        url: 'https://docs.google.com/document/d/1Bh9ZXobH3w81E_pbPWP92TChkMr1VymxRceEYqWO4jE/edit?usp=drive_link',
      },
      {
        title: 'New SR Cloud Transition',
        url: 'https://docs.google.com/document/d/1SvYiKQOAjAjYNxzvlq6k1XQOzF3tMHadP68y4DOmldc/edit?usp=drive_link',
      },
      {
        title: 'Cloud Coordinator Onboarding',
        url: 'https://docs.google.com/document/d/1ZnBgm-n_sH3sSh3WhGgleOQd7T5lFO6_6bXLwweXT_I/edit?usp=drive_link',
      },
    ],
  },
  {
    name: 'Fundraising',
    docs: [
      {
        title: 'Basic Functions of Bloomerang',
        url: 'https://docs.google.com/document/d/1AJvOfOl3L1BdM_uwMv5TCK96i0b_QAdjDm8SDdaQuOQ/edit?usp=drive_link',
      },
      {
        title: 'Adding New Donors to Bloomerang',
        url: 'https://docs.google.com/document/d/1nvDUO9Q_eGfsM_9FV6zKDnq_mPH7vmOyRL2QWh6dNss/edit?usp=drive_link',
      },
      {
        title: 'Sending Mass Emails on Bloomerang',
        url: 'https://docs.google.com/document/d/1pdBSeHKD8Jt__nBQ-2v6wDX2SpQo1xAxJP4ohzCNZYk/edit?usp=drive_link',
      },
      {
        title: 'Bloomerang Wordpress Integration',
        url: 'https://docs.google.com/document/d/1Ob35N1laZB_ck2mf1mTwRQWpy9FFAzlZZDyGBm7bKQw/edit?usp=drive_link',
      },
      {
        title: 'Exporting Engagement Information from Bloomerang',
        url: 'https://docs.google.com/document/d/1siw-z6rKfiMPc2hkX7BrzSKYfuBAwGNohKrC1rhr07I/edit?usp=drive_link',
      },
      {
        title: 'Integrating DoubleTheDonation with Wordpress',
        url: 'https://docs.google.com/document/d/1Nb1YTyYrR5UTn-V56cCqGSe4jiPw7STYzn6rpLNOX0E/edit?usp=sharing',
      },
      {
        title: 'Filing a Matching Request (DTD)',
        url: 'https://docs.google.com/document/d/1Q8U0zd8T6dYFPnB5U0D7qQf7EjT2f9invMhN9B4q1_o/edit?usp=sharing',
      },
      {
        title: 'DTD Basic Procedure and Functions',
        url: 'https://docs.google.com/document/d/1frJtpnDgdXA6fdCityWYMryovIuwPNuT3X98MLSpIRU/edit?usp=sharing',
      },
      {
        title: 'Creating a Campaign (FundraiseUp)',
        url: 'https://docs.google.com/document/d/1hYSO3IZIOO7zeAg0FHzD6FvR19d7aqBlhLzsj-efkik/edit?usp=sharing',
      },
      {
        title: 'Exporting a Campaign to Transaction (FundraiseUp)',
        url: 'https://docs.google.com/document/d/1j-gT8gsdWKpTI3910qWLyDYqbE40DnAs0HKPmuCQMz0/edit?usp=sharing',
      },
      {
        title: 'FundraiseUp Basic Functions',
        url: 'https://docs.google.com/document/d/1dCrwIDx-FES-74ywe1ve5h-Pzn7WZK2SrDEDn3zWKlU/edit?usp=sharing',
      },
      {
        title: 'MailChimp Basic Functions',
        url: 'https://docs.google.com/document/d/1iOKcsmkPKx3TJm3BRVYxFKG5qR-JEiu6W_XOCCe427w/edit?usp=sharing',
      },
    ],
  },
  {
    name: 'Vision / Planning',
    docs: [
      {
        title: 'Vision Progress & Documentation',
        url: 'https://docs.google.com/document/d/1Eu-MLNuCa-csxB5wO42Gb7qTCBsFAto9tbuuGFDmn00/edit',
      },
      {
        title: 'Objective Follow Up',
        url: 'https://docs.google.com/document/d/1LZiodsaE-Jk287rlmmlTFV-9BwJ6dQfvhOOuC4OMqdQ/edit',
      },
      {
        title: 'Conducting an Annual Planning',
        url: 'https://docs.google.com/document/d/16d3FOnQ3DEdAom_Gv_iZpOUuPNkZdN3FArtwnIRc6U4/edit?usp=sharing',
      },
    ],
  },
  {
    name: 'Retreat',
    docs: [
      {
        title: 'Retreat Onboarding Procedures',
        url: 'https://docs.google.com/document/d/1y7fGU0FnmEyId6wxLFz3mGIA9dZVHvUV0snD8D_k81c/edit?usp=sharing',
      },
      {
        title: 'Retreat Handbook',
        url: 'https://docs.google.com/document/d/1hwcdljk9oTjmMmzWZPgDpDHcWoR9fVws979NawsstLw/edit?usp=sharing',
      },
      {
        title: 'Retreat Logistics',
        url: 'https://docs.google.com/document/d/163fIvl7zVayllU3lVbNG_xWv9v1eRCmLKAmRgR0w82o/edit?usp=sharing',
      },
      {
        title: 'Retreat Program/Marketing',
        url: 'https://docs.google.com/document/d/1mfLtUvEV1JI1_rxWdWsdHMCFd3aMhe_4ns88uPXJOjY/edit?usp=sharing',
      },
      {
        title: 'Retreat Finances',
        url: 'https://docs.google.com/document/d/1W358VkKa4z-qs889H_w_WVLvGbq7GN-AgtIi0iyd-rM/edit?usp=sharing',
      },
      {
        title: 'Retreat Lead',
        url: 'https://docs.google.com/document/d/1AqeZ8ZzUHnsMpjBUck3f3K5qnv35BX5wCHukMRSz048/edit?usp=sharing',
      },
      {
        title: 'Retreat Liability Management',
        url: 'https://docs.google.com/document/d/1o0W7O3KAqZ3CYkTWVl3atJk7gjfoBNECB1y-Zn8u22Q/edit?usp=sharing',
      },
    ],
  },
  {
    name: 'Muslim Youth Issues',
    docs: [
      {
        title: 'MYI Team Onboarding',
        url: 'https://docs.google.com/document/d/1lJ36X7JVxukNF7lZGiAxPftquc3A95XVCMmBmxPJXrI/edit?usp=drive_link',
      },
      {
        title: 'MYI Leadership Trainings',
        url: 'https://docs.google.com/document/d/1oe8Qnvnj84uiqrUncQev83NOaqbj4rZAHNDozXmRmJ8/edit?usp=sharing',
      },
      {
        title: 'Running a MYI Webinar',
        url: 'https://docs.google.com/document/d/1JfsvlrPlRogJUTZizpp6yMj5yqQQ8F8GUM5POZAEjZk/edit?usp=drive_link',
      },
    ],
  },
  {
    name: 'IT',
    docs: [
      {
        title: 'Creating Website Forms',
        url: 'https://docs.google.com/document/d/17Waz1z7Iq0SpY6BkFLE2Ir99iX9kGdcBTY-oWUYfP2I/edit?usp=drive_link',
      },
      {
        title: 'Creating GSuite Emails',
        url: 'https://docs.google.com/document/d/1oD8tnkerMaSSpkWngD1MNiiraySZA-8u5VouynvptmY/edit?usp=drive_link',
      },
      {
        title: 'Creating GSuite Email Aliases',
        url: 'https://docs.google.com/document/d/1MJLqBTDjU6BoyQoYmPF7GVjOZSndq2fay07F-QmYZOA/edit?usp=drive_link',
      },
      {
        title: 'Enabling Stripe Payments',
        url: 'https://docs.google.com/document/d/1dAYOWVLh5AsGIVGmUiYwAq4D7PyuyBqZkuOKGKMA2WI/edit?usp=drive_link',
      },
      {
        title: 'Creating Website Pages',
        url: 'https://docs.google.com/document/d/1q9vb7Sl9hkw5yiHkCwmcDbkDmumD1k1ewYbq2iXBg9c/edit?usp=drive_link',
      },
    ],
  },
]
