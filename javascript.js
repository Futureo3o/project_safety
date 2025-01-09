$(document).ready(function () {
  const ctprvnSet = new Set(); // 시/도 중복 제거용 Set
  let totalCount = 0; // 전체 데이터 개수를 저장할 변수
  let shelters = []; // 전체 대피소 데이터를 저장할 배열
  let promises = []; // 여러 개의 AJAX 요청을 관리할 배열
  const markers = []; // 지도에 표시된 마커를 관리할 배열
  const serviceKey = "iC+LvW1YNBbNnJkQrEug+9Rv0t00MZezpZED9mBDKM6bQyWWEEmD6hPs/tVSndCwSGaZe1JsBMduvqC/IdwZ/g==";

  // 카카오 맵 초기 설정
  const mapContainer = document.getElementById("map");
  const mapOption = {
    center: new kakao.maps.LatLng(37.5665, 126.978), // 초기 중심 좌표 (서울시청)
    level: 10, // 초기 확대 레벨
  };
  const map = new kakao.maps.Map(mapContainer, mapOption);

  // 마커 초기화 함수
  function clearMarkers() {
    markers.forEach((marker) => marker.setMap(null));
    markers.length = 0;
  }

  // 전체 데이터 개수를 얻기 위한 첫 번째 API 요청
  $.ajax({
    url: "https://apis.data.go.kr/1741000/EmergencyAssemblyArea_Earthquake5/getArea4List2",
    type: "GET",
    dataType: "jsonp", // jsonp 방식으로 데이터를 요청
    data: {
      ServiceKey: serviceKey,
      pageNo: 1,
      numOfRows: 1,
      type: "json",
    },
    success: function (response) {
      totalCount = response.EarthquakeOutdoorsShelter2[0].head[0].totalCount;
      console.log("전체 데이터 개수:", totalCount);

      const totalPages = Math.ceil(totalCount / 100);
      for (let page = 1; page <= totalPages; page++) {
        promises.push(
          $.ajax({
            url: "https://apis.data.go.kr/1741000/EmergencyAssemblyArea_Earthquake5/getArea4List2",
            type: "GET",
            dataType: "jsonp",
            data: {
              ServiceKey: serviceKey,
              pageNo: page,
              numOfRows: 100,
              type: "json",
            },
            success: function (response) {
              const currentShelters =
                response.EarthquakeOutdoorsShelter2[1].row;
              shelters = shelters.concat(currentShelters);
              currentShelters.forEach((shelter) =>
                ctprvnSet.add(shelter.ctprvn_nm)
              );
            },
            error: function (xhr, status, error) {
              console.error("데이터를 불러오는 중 오류가 발생했습니다:", error);
            },
          })
        );
      }

      $.when.apply($, promises).then(function () {
        console.log("모든 데이터 요청 완료");

        const sortedCtprvn = Array.from(ctprvnSet).sort();
        sortedCtprvn.forEach((ctprvn) => {
          $("#ctprvn").append(`<option value="${ctprvn}">${ctprvn}</option>`);
        });

        $("#ctprvn").change(function () {
          const selectedCtprvn = $(this).val();
          $("#sgg").empty().append("<option>시/군/구 선택</option>");
          const filteredSgg = shelters.filter(
            (shelter) => shelter.ctprvn_nm === selectedCtprvn
          );
          const sggSet = new Set();
          filteredSgg.forEach((shelter) => sggSet.add(shelter.sgg_nm));
          const sortedSgg = Array.from(sggSet).sort();
          sortedSgg.forEach((sgg) => {
            $("#sgg").append(`<option value="${sgg}">${sgg}</option>`);
          });
        });

        $("#fetchBtn").click(function () {
          const selectedSgg = $("#sgg").val();
          $("#shelter-list").empty();
          clearMarkers();

          const filteredShelters = shelters.filter(
            (shelter) => shelter.sgg_nm === selectedSgg
          );
          if (filteredShelters.length > 0) {
            filteredShelters.forEach(function (shelter) {
              const listItem = `
                                        <li>
                                            <div>
                                                <h3>${shelter.vt_acmdfclty_nm}</h3>
                                                <p>${shelter.rn_adres}</p>
                                            </div>
                                        </li>`;
              $("#shelter-list").append(listItem);

              // 마커 생성 및 지도에 표시
              const markerPosition = new kakao.maps.LatLng(
                shelter.ycord,
                shelter.xcord
              );
              const marker = new kakao.maps.Marker({
                map: map,
                position: markerPosition,
                title: shelter.vt_acmdfclty_nm,
              });
              markers.push(marker);
            });

            // 지도 중심을 첫 번째 대피소 위치로 이동
            const firstShelter = filteredShelters[0];
            const centerPosition = new kakao.maps.LatLng(
              firstShelter.ycord,
              firstShelter.xcord
            );
            map.setCenter(centerPosition);
            map.setLevel(5);
          } else {
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
