export const COMPARE_KEY = "compareCars";

export const getCompareCars = () => {
  try {
    return JSON.parse(localStorage.getItem(COMPARE_KEY)) || [];
  } catch {
    return [];
  }
};

export const addToCompare = (carId) => {
  const current = getCompareCars();

  if (current.includes(carId)) {
    return {
      ok: false,
      message: "Xe này đã có trong danh sách so sánh",
    };
  }

  if (current.length >= 3) {
    return {
      ok: false,
      message: "Chỉ được so sánh tối đa 3 xe",
    };
  }

  const updated = [...current, carId];
  localStorage.setItem(COMPARE_KEY, JSON.stringify(updated));

  return {
    ok: true,
    message: "Đã thêm xe vào danh sách so sánh",
    data: updated,
  };
};

export const removeFromCompare = (carId) => {
  const current = getCompareCars();
  const updated = current.filter((id) => id !== carId);
  localStorage.setItem(COMPARE_KEY, JSON.stringify(updated));
  return updated;
};

export const clearCompareCars = () => {
  localStorage.removeItem(COMPARE_KEY);
};