// ===== Game defs =====
  const UNITS = {
    infantry: { name:"Bộ binh", atk:10, def:12, cost:{wood:50, clay:30, iron:20, crop:10} },
    archer:   { name:"Cung thủ", atk:12, def: 9, cost:{wood:60, clay:20, iron:30, crop:10} },
    cavalry:  { name:"Kỵ binh", atk:20, def:14, cost:{wood:90, clay:60, iron:70, crop:30} },
  };

  const BUILDINGS = {
    // Sản lượng: Lv1 = 12/phút, mỗi lần nâng cấp +9/phút
    woodcutter:{
      name:"Trại tiều phu", prodKey:"wood",
      base:{wood:60, clay:40, iron:20, crop:10},
      prodBase:12, prodPerLv:9,
      desc:{
        lead:"Trại tiều phu khai thác <b>Gỗ</b> đều đặn theo từng phút để phục vụ xây dựng và huấn luyện.",
        bullets:[
          "Tạo Gỗ tự động theo nhịp tài nguyên (mỗi phút cộng 1 lần).",
          "Gỗ dùng để nâng cấp công trình, huấn luyện quân và một số chi phí hành quân.",
          "Nếu kho chứa đầy, phần Gỗ vượt sức chứa sẽ bị thất thoát."
        ],
        upgrade:"Cấp 1: <b>12 Gỗ/phút</b>. Mỗi lần nâng cấp tăng thêm <b>+9 Gỗ/phút</b>."
      }
    },
    claypit:{
      name:"Mỏ đất sét", prodKey:"clay",
      base:{wood:40, clay:60, iron:20, crop:10},
      prodBase:12, prodPerLv:9,
      desc:{
        lead:"Mỏ đất sét cung cấp <b>Đất sét</b> — nguyên liệu cốt lõi để mở rộng làng và nâng cấp kho.",
        bullets:[
          "Tạo Đất sét tự động theo nhịp tài nguyên (mỗi phút cộng 1 lần).",
          "Đất sét thường là nút thắt khi anh nâng cấp nhiều công trình cùng lúc.",
          "Muốn farm lâu không tràn, nên nâng Kho chứa song song với mỏ."
        ],
        upgrade:"Cấp 1: <b>12 Đất sét/phút</b>. Mỗi lần nâng cấp tăng thêm <b>+9 Đất sét/phút</b>."
      }
    },
    ironmine:{
      name:"Mỏ sắt", prodKey:"iron",
      base:{wood:40, clay:40, iron:60, crop:10},
      prodBase:12, prodPerLv:9,
      desc:{
        lead:"Mỏ sắt tạo ra <b>Sắt</b> — tài nguyên quan trọng nhất cho huấn luyện quân và sức mạnh quân sự.",
        bullets:[
          "Tạo Sắt tự động theo nhịp tài nguyên (mỗi phút cộng 1 lần).",
          "Sắt thường tiêu nhiều khi anh chuyển sang Cung thủ/Kỵ binh.",
          "Khi muốn đánh mạnh, ưu tiên nâng Mỏ sắt trước." 
        ],
        upgrade:"Cấp 1: <b>12 Sắt/phút</b>. Mỗi lần nâng cấp tăng thêm <b>+9 Sắt/phút</b>."
      }
    },
    cropland:{
      name:"Ruộng lúa", prodKey:"crop",
      base:{wood:30, clay:30, iron:30, crop:40},
      prodBase:12, prodPerLv:9,
      desc:{
        lead:"Ruộng lúa sản xuất <b>Lương thực</b> — thứ nuôi quân và duy trì nhịp phát triển ổn định.",
        bullets:[
          "Tạo Lương thực tự động theo nhịp tài nguyên (mỗi phút cộng 1 lần).",
          "Lương thực là chi phí bắt buộc khi huấn luyện mọi loại quân.",
          "Thiếu lương sẽ khiến anh bị chậm train và chậm mở rộng lực lượng."
        ],
        upgrade:"Cấp 1: <b>12 Lương thực/phút</b>. Mỗi lần nâng cấp tăng thêm <b>+9 Lương thực/phút</b>."
      }
    },
    warehouse:{
      name:"Kho chứa", prodKey:null,
      base:{wood:80, clay:60, iron:40, crop:20},
      capPerLv:CFG.warehousePerLv,
      desc:{
        lead:"Kho chứa tăng <b>sức chứa tối đa</b> cho Gỗ, Đất sét và Sắt — giúp anh tích lũy để nâng cấp lớn.",
        bullets:[
          "Tăng trần lưu trữ 3 tài nguyên: Gỗ/Đất sét/Sắt.",
          "Giảm thất thoát khi sản lượng cao nhưng anh chưa kịp tiêu tài nguyên.",
          "Rất nên nâng trước khi đi ngủ/AFK để không bị tràn."
        ],
        upgrade:`Mỗi cấp tăng thêm <b>+${CFG.warehousePerLv}</b> sức chứa cho Kho chứa.`
      }
    },
    granary:{
      name:"Kho lương", prodKey:null,
      base:{wood:60, clay:40, iron:40, crop:40},
      capPerLv:CFG.granaryPerLv,
      desc:{
        lead:"Kho lương tăng <b>sức chứa Lương thực</b> — giúp anh tích trữ để train quân số lớn.",
        bullets:[
          "Tăng trần lưu trữ riêng cho Lương thực.",
          "Khi train liên tục, Kho lương cao giúp anh không bị đứt nhịp.",
          "Kết hợp nâng Ruộng lúa + Kho lương để tối ưu tốc độ phát triển quân." 
        ],
        upgrade:`Mỗi cấp tăng thêm <b>+${CFG.granaryPerLv}</b> sức chứa cho Kho lương.`
      }
    },
  };

  const TRAIN_BUILDINGS = {
    infantryCamp: {
      name:"Trại Lính", unit:"infantry",
      desc:{
        lead:"Trại Lính là nơi huấn luyện <b>Bộ binh</b> — tuyến đầu dễ train, phù hợp phòng thủ và giữ ô.",
        bullets:[
          "Huấn luyện Bộ binh theo số lượng anh chọn; chạy theo hàng đợi riêng của công trình.",
          "Mỗi quân tốn tài nguyên và mất thời gian huấn luyện (3 giây/quân trong bản hiện tại).",
          "Quân sau khi huấn luyện sẽ cộng vào quân đội để hành quân/chiến đấu."
        ],
        upgrade:"Bản hiện tại chưa có cơ chế nâng cấp doanh trại. Dự kiến sau này nâng cấp sẽ giảm thời gian huấn luyện hoặc mở khóa tính năng mới."
      }
    },
    archeryRange: {
      name:"Trường Bắn", unit:"archer",
      desc:{
        lead:"Trường Bắn huấn luyện <b>Cung thủ</b> — sát thương tốt, nhưng đòi hỏi tài nguyên cân bằng hơn.",
        bullets:[
          "Huấn luyện Cung thủ theo số lượng anh chọn; hàng đợi riêng từng công trình.",
          "Cung thủ có Công cao hơn Bộ binh nhưng Thủ thấp hơn (xem chỉ số ngay trong bảng huấn luyện).",
          "Phù hợp để tăng lực đánh khi anh bắt đầu đẩy map và săn kẻ địch."
        ],
        upgrade:"Bản hiện tại chưa có cơ chế nâng cấp doanh trại. Dự kiến sau này nâng cấp sẽ giảm thời gian huấn luyện hoặc tăng hiệu quả/giới hạn huấn luyện."
      }
    },
    stable: {
      name:"Chuồng Ngựa", unit:"cavalry",
      desc:{
        lead:"Chuồng Ngựa huấn luyện <b>Kỵ binh</b> — lực chiến cao, cơ động, thích hợp đánh nhanh chiếm ô.",
        bullets:[
          "Huấn luyện Kỵ binh theo số lượng anh chọn; tiêu tốn tài nguyên nhiều hơn.",
          "Kỵ binh có Công/Thủ cao, rất hợp để làm mũi nhọn khi hành quân.",
          "Khi muốn phát triển kỵ binh, nên nâng Mỏ sắt + Ruộng lúa song song để đủ chi phí train." 
        ],
        upgrade:"Bản hiện tại chưa có cơ chế nâng cấp doanh trại. Dự kiến sau này nâng cấp sẽ giảm thời gian huấn luyện hoặc tăng sức mạnh/độ cơ động cho đội hình."
      }
    },
  };
