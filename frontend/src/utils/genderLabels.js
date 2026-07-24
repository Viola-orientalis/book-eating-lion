export const GENDER_LABELS = {
  MALE: '남성',
  FEMALE: '여성',
}

export const getGenderLabel = (gender) => GENDER_LABELS[gender] ?? gender ?? '알 수 없음'
