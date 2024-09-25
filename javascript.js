<script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=8900b86598ac8014d80bf21cdba2ed88"></script>
var mapContainer = document.getElementById("map"), // 지도를 표시할 div
  mapOption = {
    center: new kakao.maps.LatLng(37.4722248, 126.8859774), // 지도의 중심좌표
    level: 3, // 지도의 확대 레벨
  };

var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

// 마커가 표시될 위치입니다
var markerPosition = new kakao.maps.LatLng(37.4722248, 126.8859774);

// 마커를 생성합니다
var marker = new kakao.maps.Marker({
  position: markerPosition,
});

// 마커가 지도 위에 표시되도록 설정합니다
marker.setMap(map);

document.getElementById("myLocationBtn").addEventListener("click", function () {
  map.setCenter(new kakao.maps.LatLng(37.4722248, 126.8859774));
  map.setLevel(3);
});

// 아래 코드는 지도 위의 마커를 제거하는 코드입니다
// marker.setMap(null);

//  https://apis.data.go.kr/1741000/EmergencyAssemblyArea_Earthquake5/getArea4List2?ServiceKey=iC%2BLvW1YNBbNnJkQrEug%2B9Rv0t00MZezpZED9mBDKM6bQyWWEEmD6hPs%2FtVSndCwSGaZe1JsBMduvqC%2FIdwZ%2Fg%3D%3D&pageNo=1&numOfRows=1&type=json
$(document).ready(function () {
  const ctprvnSet = new Set(); // 시/도 중복 제거용 Set
  let totalCount = 0; // 전체 데이터 개수를 저장할 변수
  let shelters = []; // 전체 대피소 데이터를 저장할 배열
  let promises = []; // 여러 개의 AJAX 요청을 관리할 배열

  // 1. 전체 데이터 개수를 얻기 위한 첫 번째 API 요청
  $.ajax({
    url: "https://apis.data.go.kr/1741000/EmergencyAssemblyArea_Earthquake5/getArea4List2",
    type: "GET",
    dataType: "jsonp", // jsonp 방식으로 데이터를 요청
    data: {
      ServiceKey:
        "iC+LvW1YNBbNnJkQrEug+9Rv0t00MZezpZED9mBDKM6bQyWWEEmD6hPs/tVSndCwSGaZe1JsBMduvqC/IdwZ/g==",
      pageNo: 1,
      numOfRows: 1, // 한 개의 데이터만 요청하여 전체 개수를 확인
      type: "json", // 응답 형식을 JSON으로 요청
    },
    success: function (response) {
      // 전체 데이터 개수(totalCount)를 추출
      totalCount = response.EarthquakeOutdoorsShelter2[0].head[0].totalCount;
      console.log("전체 데이터 개수:", totalCount);

      // 총 페이지 수 계산: 한 페이지에 100개씩 가져온다고 가정
      const totalPages = Math.ceil(totalCount / 100);

      // 2. 모든 페이지 데이터를 요청하는 AJAX 호출
      for (let page = 1; page <= totalPages; page++) {
        promises.push(
          $.ajax({
            url: "https://apis.data.go.kr/1741000/EmergencyAssemblyArea_Earthquake5/getArea4List2",
            type: "GET",
            dataType: "jsonp", // jsonp 방식으로 데이터 요청
            data: {
              ServiceKey:
                "iC+LvW1YNBbNnJkQrEug+9Rv0t00MZezpZED9mBDKM6bQyWWEEmD6hPs/tVSndCwSGaZe1JsBMduvqC/IdwZ/g==",
              pageNo: page,
              numOfRows: 100, // 한 페이지에 100개씩 데이터 요청
              type: "json", // 응답 형식을 JSON으로 요청
            },
            success: function (response) {
              // 현재 페이지에서 가져온 데이터 (row 항목)
              const currentShelters =
                response.EarthquakeOutdoorsShelter2[1].row;

              // 대피소 데이터를 shelters 배열에 저장
              shelters = shelters.concat(currentShelters);

              // 시/도(ctprvn_nm) 중복 없이 Set에 저장
              currentShelters.forEach(function (shelter) {
                ctprvnSet.add(shelter.ctprvn_nm);
              });
            },
            error: function (xhr, status, error) {
              console.error("데이터를 불러오는 중 오류가 발생했습니다:", error);
            },
          })
        );
      }

      // 3. 모든 AJAX 요청이 완료된 후 실행
      $.when.apply($, promises).then(function () {
        console.log("모든 데이터 요청 완료");

        // 시/도(ctprvn_nm) 배열을 정렬하여 옵션 추가
        const sortedCtprvn = Array.from(ctprvnSet).sort(); // Set을 배열로 변환 후 정렬
        sortedCtprvn.forEach(function (ctprvn) {
          $("#ctprvn").append(`<option value="${ctprvn}">${ctprvn}</option>`);
        });

        // 시/도 선택 시, 해당 시/도에 맞는 시/군/구 옵션 추가
        $("#ctprvn").change(function () {
          const selectedCtprvn = $(this).val(); // 선택된 시/도 값

          // 시/군/구 옵션 초기화
          $("#sgg").empty().append("<option>시/군/구 선택</option>");

          // 선택된 시/도에 맞는 시/군/구를 필터링하여 옵션 추가
          const filteredSgg = shelters.filter(function (shelter) {
            return shelter.ctprvn_nm === selectedCtprvn;
          });

          // 중복되지 않도록 Set을 사용해 시/군/구 추가
          const sggSet = new Set();
          filteredSgg.forEach(function (shelter) {
            sggSet.add(shelter.sgg_nm);
          });

          // 시/군/구 배열을 정렬하여 옵션 추가
          const sortedSgg = Array.from(sggSet).sort(); // Set을 배열로 변환 후 정렬
          sortedSgg.forEach(function (sgg) {
            $("#sgg").append(`<option value="${sgg}">${sgg}</option>`);
          });
        });

        // 조회 버튼 클릭 시, 해당 시/군/구에 맞는 대피소 데이터를 필터링 후 리스트에 추가
        $("#fetchBtn").click(function () {
          const selectedSgg = $("#sgg").val(); // 선택된 시/군/구 값

          // 대피소 리스트 초기화
          $("#shelter-list").empty();

          // 선택된 시/군/구에 맞는 대피소 데이터 필터링
          const filteredShelters = shelters.filter(function (shelter) {
            return shelter.sgg_nm === selectedSgg;
          });

          // 필터링된 대피소 데이터를 리스트로 추가
          if (filteredShelters.length > 0) {
            filteredShelters.forEach(function (shelter) {
              console.log(shelter);
              const listItem = `
                      <li>
                        <div>
                          <h3>${shelter.vt_acmdfclty_nm}</h3>
                          <p>${
                            shelter.rn_adres
                              ? shelter.rn_adres
                              : shelter.dtl_adres
                          }</p>
                        </div>
                        <i class="fa-solid fa-chevron-right"></i>
                      </li>
                    `;
              $("#shelter-list").append(listItem);
            });
          } else {
            // 검색 결과가 없는 경우
            $("#shelter-list").append("<li>검색 결과가 없습니다.</li>");
          }
        });
      });
    },
    error: function (xhr, status, error) {
      console.error("데이터를 불러오는 중 오류가 발생했습니다:", error);
    },
  });
});
