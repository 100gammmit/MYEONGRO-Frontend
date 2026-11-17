// Generates src/domain/zodiac-fortune/ipchun.json: the Korea civil time of 입춘 for 1900–2099.
//
// It uses the same engine as the backend saju calculation (cn.6tail lunar 1.7.7) and the same
// conversion as SajuMonthlyCalendarService: lunar-java's term clock is UTC+8, and public times
// are Korea civil time (Asia/Seoul, so 1950s UTC+8:30 and historical summer time are applied).
// The page reads only the JSON; rerun this when the engine version changes.
//
// Run from MYEONGRO-Front with the jar the backend resolves from Gradle, e.g.:
//   java -cp "$(find ~/.gradle -name lunar-1.7.7.jar | head -1)" scripts/generate-ipchun.java \
//     src/domain/zodiac-fortune/ipchun.json
import com.nlf.calendar.Solar;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public class GenerateIpchun {
	private static final ZoneOffset ENGINE_OFFSET = ZoneOffset.ofHours(8);
	private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");
	private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mmXXX");

	public static void main(String[] args) throws Exception {
		StringBuilder json = new StringBuilder("{\n");
		for (int year = 1900; year <= 2099; year++) {
			// The lunar year that contains July holds this calendar year's 입춘 in early February.
			Solar term = Solar.fromYmd(year, 7, 1).getLunar().getJieQiTable().get("立春");
			var korea = LocalDateTime.parse(term.toYmdHms().replace(' ', 'T'))
				.atOffset(ENGINE_OFFSET)
				.atZoneSameInstant(KOREA)
				.toOffsetDateTime();
			if (korea.getYear() != year || korea.getMonthValue() != 2) {
				throw new IllegalStateException("Unexpected 입춘 for " + year + ": " + korea);
			}
			json.append("  \"").append(year).append("\": \"").append(korea.format(FORMAT)).append('"')
				.append(year < 2099 ? ",\n" : "\n");
		}
		json.append("}\n");
		Files.writeString(Path.of(args[0]), json.toString(), StandardCharsets.UTF_8);
	}
}
