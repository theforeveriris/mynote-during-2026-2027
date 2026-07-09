/*对局记录 MatchRecord
属性：对局编号、对战双方战队、双方获得积分、比赛结果（A胜/B胜/平局）；
积分规则：胜利战队+3积分，平局两队各+1积分，失败无积分。*/

public class MatchRecord {

    private int id;
    private int teamAId;
    private int teamBId;
    private int scoreA;
    private int scoreB;
    private String result;

    public MatchRecord(
        int id,
        int teamAId,
        int teamBId,
        int scoreA,
        int scoreB,
        String result
    ) {
        this.id = id;
        this.teamAId = teamAId;
        this.teamBId = teamBId;
        this.scoreA = scoreA;
        this.scoreB = scoreB;
        this.result = result;
    }

    public int getId() {
        return id;
    }

    public int getTeamAId() {
        return teamAId;
    }

    public int getTeamBId() {
        return teamBId;
    }

    public void showRecord() {
        String teamAName = "还没有设置/找到喵";
        String teamBName = "还没有设置/找到喵";

        /*遍历Main类中的全局战队集合,根据 ID 找 name*/
        for (Team team : Main.teams) {
            if (team.getId() == teamAId) {
                teamAName = team.getName();
            }
            if (team.getId() == teamBId) {
                teamBName = team.getName();
            }
        }
        System.out.println("对局ID: " + id);
        System.out.println(
            "对战双方: " +
                teamAName +
                "(+" +
                scoreA +
                ") VS " +
                teamBName +
                "(+" +
                scoreB +
                ")"
        );
        System.out.println("比赛结果: " + result);
    }
}
